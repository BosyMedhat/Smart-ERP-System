
// mohmat el malaf da hwa eny maktpesh el link el 5as pe el server akter men mra 
// a7to hena pas 3ashan lma age a3mel publish fa a8er el link men hena pas 

// axios da esm el liberary ele ptklm el django 3ashan tgep meno el data 
// conf e5tsar le confgration  and ts for type script


import axios from "axios"; 


const apiClient = axios.create({ 
    baseURL: 'http://127.0.0.1:8000/api/',
    // hena ka2ny pa2ol le el backend ana 7p3tlk json we enta rod 3lya pe json pardo
    headers: {
        'Content-Type': 'application/json', 
    }
});

// ya3ne pakol le el react ay malaf 3aez yklm el backend  y3mel import le apiClient
export default apiClient;