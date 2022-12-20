import os
import re
from datetime import datetime
from typing import Dict
import pandas as pd
import pycountry
from enum import Enum
from transformers import AutoModelForSeq2SeqLM, AutoTokenizer, pipeline
import wget
import fasttext
from nltk import sent_tokenize, download, data
from pydantic import BaseModel


class LangDetectionOutput(str, Enum):
    alpha = 'alpha'
    flores = 'flores'
    human_readable = 'human readable'


class Translation(BaseModel):
    target_lang: str
    source_lang: str
    detected_langs: list[str]
    translated: list[str]
    translation_time: float


class FTLangDetect:
    FTLANG_CACHE = os.getenv("FTLANG_CACHE", "/tmp/fasttext-langdetect")

    def __init__(self):
        self._model = self._get_or_load_ft_model()

    @staticmethod
    def _get_language_hr(shortcode: str) -> str:
        if len(shortcode) == 2:
            return pycountry.languages.get(alpha_2=shortcode).name
        elif len(shortcode) == 3:
            return pycountry.languages.get(alpha_3=shortcode).name
        else:
            return "Unknown"

    def _download_ft_model(self):
        name = "lid.176.bin"
        url = f"https://dl.fbaipublicfiles.com/fasttext/supervised-models/{name}"
        target_path = os.path.join(self.FTLANG_CACHE, name)
        if not os.path.exists(target_path):
            os.makedirs(self.FTLANG_CACHE, exist_ok=True)
            wget.download(url=url, out=target_path)
        return target_path

    def _get_or_load_ft_model(self):
        model_path = self._download_ft_model()
        model = fasttext.load_model(model_path)
        return model

    def detect_language(self, text: str, k: int = 1, shortcode=False) -> Dict[str, float]:
        labels, scores = self._model.predict(text.replace("\n"," "), k)
        if shortcode:
            labels = [x.replace("__label__", '') for x in labels]
        else:
            labels = [FTLangDetect._get_language_hr(x.replace("__label__", '')) for x in labels]
        scores = [min(float(x), 1.0) for x in scores]
        return dict(zip(labels, scores))


class Model:
    FLORES_LANG_CODE_MAPPING_URL = 'https://github.com/facebookresearch/flores/blob/main/flores200/README.md#languages-in-flores-200'
    FLORES_CSV_LOCATION = "FLORES_200_LANG_MAPPING.csv"
    TASK = "translation"
    NLLB_MODEL = "facebook/nllb-200-distilled-1.3B"

    def __init__(self):
        self._df_flores = Model._get_flores_df()
        self._model = AutoModelForSeq2SeqLM.from_pretrained(self.NLLB_MODEL)
        self._tokenizer = AutoTokenizer.from_pretrained(self.NLLB_MODEL)
        self._ft_lang_detect = FTLangDetect()

    @staticmethod
    def _get_flores_df():
        if os.path.exists(Model.FLORES_CSV_LOCATION):
            df = pd.read_csv(Model.FLORES_CSV_LOCATION)
        else:
            df = pd.read_html(Model.FLORES_LANG_CODE_MAPPING_URL, match="Acehnese")[0]
            df.columns = ['Language', 'Code']
            df.to_csv(Model.FLORES_CSV_LOCATION)
        return df

    def get_languages(self, shortcode: bool = False) -> list[str]:
        if shortcode:
            return list(self._df_flores.Code)
        else:
            return list(self._df_flores.Language)

    def get_language_code_mapping(self) -> dict[str, str]:
        return dict(zip(list(self._df_flores.Language), list(self._df_flores.Code)))

    def detect_nllb_lang(self, text: str) -> str:
        df = self._df_flores
        lang_string = next(iter(self._ft_lang_detect.detect_language(text)))
        try:
            return df[df.Language.str.contains(lang_string)]['Code'].iloc[0]
        except:
            print(f"Unable to convert detected language ({lang_string}) into FLORES_200 language code.")
            return "Unknown"

    def translate_sentance(self, text, src_lang, tgt_lang='eng_Latn', max_length=400) -> str:
        translation_pipeline = pipeline(self.TASK,
                                        model=self._model,
                                        tokenizer=self._tokenizer,
                                        src_lang=src_lang,
                                        tgt_lang=tgt_lang,
                                        max_length=max_length)

        result = translation_pipeline(text)
        return result[0]['translation_text']

    def split_sentances(self, text: str) -> list[str]:
        try:
            data.find('tokenizers/punkt')
        except LookupError:
            download('punkt')
        langs = self._ft_lang_detect.detect_language(text).keys()
        if any(lang in ['ar', 'jp', 'ko', 'zh'] for lang in langs):
            return list(re.findall(u'[^!?。\.]+[!?。\.]*', text, flags=re.U))
        return sent_tokenize(text)

    def translate(self, text: str, target_lang: str = "eng_Latn", source_lang: str = None) -> Translation:
        start_time = datetime.now()
        results = []
        text_split = self.split_sentances(text)

        for sentance in text_split:
            if not source_lang:
                try:
                    source_lang = self.detect_nllb_lang(sentance)
                except:
                    print('Unable to automatically determine language. Please specify source language.')
                    continue
            results.append(self.translate_sentance(sentance, src_lang=source_lang, tgt_lang=target_lang))
        end_time = datetime.now()
        time_taken = (end_time - start_time).total_seconds()
        results_dict = {
            "target_lang": target_lang,
            "source_lang": source_lang,
            "detected_langs": [next(iter(self._ft_lang_detect.detect_language(text, shortcode=True)))],
            "translated": [" ".join(results)],
            'translation_time': time_taken
        }
        return Translation(**results_dict)
