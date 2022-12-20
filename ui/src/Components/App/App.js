import React, { useEffect, useReducer, useState } from 'react';
import './App.css';
import Container from '@material-ui/core/Container'
import { Button } from '@material-ui/core'
import Checkbox from "@material-ui/core/Checkbox";
import TextField from '@mui/material/TextField';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import { DataGrid } from '@mui/x-data-grid';
import { Autocomplete } from '@mui/material';
import "../css/dropdown.css"
import { LoadingButton } from '@mui/lab';


const formReducer = (state, event) => {
  if(event.reset) {
    return {
      choice: '',
      file: '',
      translate: false,
      text: '',
      source_language: '',
      target_language: '',
      k: 1,
      shortcode: false,
    }
  }
 return {
   ...state,
   [event.name]: event.value
 }
}

function App() {
  const [formData, setFormData] = useReducer(formReducer, {});    // Inputs from the form
  const [identify_output, identify_setOutput] = useState([]);      
  const [translate_output, translate_setOutput] = useState([]); 
  const [transcription_output, transcription_setOutput] = useState([]);   
  const [change, setChange] = useState(false);
  const [language_choices, language_choices_setOutput] = useState([])                    
  const [loading, setLoading] = useState(false);
  const columns = [
    { field: 'id', headerName: 'ID', width: 70 },
    {
      field: 'language',
      headerName: 'Language',
      description: 'Classified likely language.',
      sortable: true,
      width: 160
    },
    {
      field: 'score',
      headerName: 'Score',
      description: 'Likelihood that language matches the uploaded file',
      sortable: true,
      width: 160
    }
  ];

  const handleSubmit = event => {
    event.preventDefault();
    setChange(false);
  }

  // Update values
  const handleChange = event => {
    setChange(false);
    setLoading(false);
    const isCheckbox = event.target.type === 'checkbox';
    setFormData({
      name: event.target.name,
      value: isCheckbox ? event.target.checked : event.target.value,
    });
  }

  // Fetch response from api depending on option
  useEffect(() => {
    console.log('use effect')
    if(formData.choice === 'identify') {
      identifyText();
    }
    if(formData.choice === 'translate') {
      console.log('translate')
      get_language_mapping();
      console.log(language_choices)
      translateText();
    }
  }, []);

  // Identify the language used in the input text - by linking to api
  const identifyText = async () => { 
    setLoading(true);

    const response = await fetch(
      'http://localhost:8000/language_detection?text=' + formData.text + '&k=' + (formData.k || 1) + '&shortcode=' + (formData.shortcode || false), 
      {
        method: "POST"
      })
      .then((response) => {
        return response.json();
      })
      .then(data => {
        var tmp_values = []
        var count = 1
        for (const [key, value] of Object.entries(data)){
          var row = {id: count, language : key , score: value};
          tmp_values.push(row);
          count += 1
        }
        identify_setOutput(tmp_values);
        setChange(true);
      })
      setLoading(false);
  }

  // Translate text into requested target language - by linking to api
  const translateText = async () => { 
    setLoading(true);
    console.log('translate text')
    console.log(formData.target_language, formData.source_language);
    const response = await fetch(
      'http://0.0.0.0:8000/translate?text=' + formData.text + '&target_lang=' + language_choices[formData.target_language] + '&source_lang=' + language_choices[formData.source_language], 
      {
        method: "POST"
      })
      .then((response) => {
        return response.json();
      })
      .then(data => {
        console.log(data);
        translate_setOutput(Object.values(data["translated"]));
        setChange(true);
      })
    setLoading(false);

  }

  // Retrieve the shortcode that matches to each language from the api so that it is in the correct format
  const get_language_mapping = () => {
    const response = fetch('http://0.0.0.0:8000/language_code_mapping')
      .then((response) => {
        return response.json();
      })
      .then(data => {
        language_choices_setOutput(data)
        setChange(true);
      })    
  }

  // Transcribe audio file
  const transcribe_audio_file = async () => {
    setLoading(true);
    console.log(formData.file)
    const transcribeData = new FormData();
    console.log(transcribeData)
    transcribeData.append("audio_file", formData.file);
    transcribeData.append("type", formData.file.type)
    const response = await fetch(
    'http://0.0.0.0:8001/transcribe?translate=' +(formData.translate || false), 
    {
      method: "POST",  
      body: transcribeData
    })
      .then((response) => {
        console.log(response)
        return response.json();
      })
      .then(data => {
        console.log(data);

        console.log(data);
        transcription_setOutput(Object.values(data["transcription"]));
        setChange(true);
      })
    setLoading(false);  
  } 


  // Shortcode and k used to identify language, everything else is used to translate
  return(
    <Container maxWidth="md" className="App">
      <h1>Language Translator</h1>
      <form onSubmit={handleSubmit}>

{/* --------------------------- Dropdown Options --------------------------------- */}
        <div>
          <InputLabel required>Options:</InputLabel>
          <Select
            name="choice"
            id="dropdown"
            label="Option"
            value={formData.choice || ''}
            onChange={handleChange}
          >
            <MenuItem value={"translate"}>Translate Text</MenuItem>
            <MenuItem value={"identify"}>Identify Language</MenuItem>
            <MenuItem value={"transcribe"}>Transcribe Audio</MenuItem>

          </Select>
        </div>

      <br></br>

{/* -------------------------------- Input --------------------------------------- */}
      { formData.choice === 'translate' | formData.choice === 'identify' &&
        <fieldset>
          <p>
            <TextField
              id="outlined-multiline-flexible"
              name="text"
              label="Text"
              style={{width: '90%'}}
              value={formData.text || ''}
              onChange={handleChange}
              multiline
              required
            />
          </p>
        </fieldset>
      }   

{/* ------------------------ Transcribe Audio Options ---------------------------- */}
      { formData.choice === 'transcribe' &&
        <fieldset>
          <div>Transcribe audio options:</div>        
          <br></br>
          
          <Button variant='contained' color="primary" component='label'>
            <input 
              accept="audio/*" 
              type='file'
              onChange={event => {
                setLoading(false);
                setFormData({
                name: 'file',
                value: event.target.files[0]})} }
              required/>
          </Button>

          <p></p>
          <div>Translate File</div>
          <Checkbox          
            label="translate file" 
            name="translate" 
            checked={formData.translate || false} 
            onChange={handleChange}
          />

          <p>
            <LoadingButton type="submit"
              loading={loading} 
              variant="contained" 
              loadingPosition="center"
              color="primary" 
              onClick={transcribe_audio_file}
              required
              >
              Transcribe Audio
            </LoadingButton>
          </p>   
                
        </fieldset>
      }
      <br></br>
      
{/* ------------------------- Translate Text Options ----------------------------- */}
        { formData.choice === 'translate' &&
          <fieldset> 
            {get_language_mapping()}
            <div>Translate text options:</div>
      
            <br></br>  

            <div>
              <Autocomplete
                clearOnEscape
                style={{width: '30%',marginLeft: '33%', marginRight: '33.3%'}}
                value={formData.source_language}             
                options={Object.keys(language_choices)}
                
                onChange={(event) =>     
                  setFormData({
                    name: 'source_language',
                    value: event.target.innerText,
                  })
                }

                renderInput={(params) => 
                  <TextField {...params}
                    label="Source Language"
                  />
                }
              />
            </div>

            <br></br>

            <div>
              <Autocomplete
                clearOnEscape
                style={{width: '30%',marginLeft: '33%', marginRight: '33.3%'}}
                value={formData.target_language}    
                options={Object.keys(language_choices)}

                onChange={(event) =>     
                  setFormData({
                    name: 'target_language',
                    value: event.target.innerText,
                    })
                  }
                renderInput={(params) => 
                  <TextField {...params}
                    label="Target Language"
                />}
              />
            </div>

            <p>
              <LoadingButton type="submit" 
                loading={loading}
                variant="contained" 
                loadingPosition="center"
                color="primary" 
                onClick={translateText}
                >
                Translate Text
              </LoadingButton>
            </p>   
          </fieldset>
        }

{/* ------------------------ Identify Language Options --------------------------- */}
        { formData.choice === 'identify' &&
          <fieldset> 
            <div>Identify language options:</div>        
            <br></br>
            <TextField        
              id="outlined-name"
              name="k"
              label="Top k outputs: default k=1"
              value={formData.k || ''}
              onChange={handleChange}
            />
            <div>Shortcode</div>
              <Checkbox          
                label="shortcode" 
                name="shortcode" 
                checked={formData['shortcode'] || false} 
                onChange={handleChange}
              />
            <p>
              <LoadingButton type="submit"
                loading={loading} 
                variant="contained" 
                loadingPosition="center"
                color="primary" 
                onClick={identifyText}
                >
                Identify Language
              </LoadingButton>
            </p>   
          </fieldset>
        }

{/* ------------------------------ Reset Button ---------------------------------- */}
        <p>
          <Button type="reset" 
            variant="contained" 
            color="primary" 
            onClick={() => {
              setChange(false);
              setFormData({reset: true})
              identify_setOutput([])
              translate_setOutput('')
              }
            }>
            Reset
          </Button>
        </p>
  
      </form>
      
      <br></br>
      <br></br>

{/* ---------------------- Change output based on option ------------------------- */}
      {change &&
        <fieldset>      
          {formData.choice === 'identify' &&
            <div style={{height: 400}}>
              <DataGrid
                rows={identify_output}
                columns={columns}
                pageSize={5}
                rowsPerPageOptions={[5]}
              />
            </div>
          }

          {formData.choice === 'translate' &&
            <div>
              <strong>Translation: </strong>
              <p>{translate_output}</p>
            </div>
          }

          {formData.choice === 'transcribe' &&
            <div>
              <strong>Transcription: </strong>
              <p>{transcription_output}</p>
            </div>
            }
        </fieldset>
      }          
    </Container>
  )
}

export default App;
