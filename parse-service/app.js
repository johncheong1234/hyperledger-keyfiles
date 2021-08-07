const express = require('express')
const app = express()
const port = 3002
var xlsx = require('node-xlsx').default;

const axios = require('axios')

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.get('/parse_sgx', (req, res) => {
    
    const resulty = xlsx.parse(`${__dirname}/New_sgx_2.xlsx`);
    // console.log(result)

    var result = resulty[0]['data'].slice(1)

    for(const i of result){
  
        const new_i = i[2].split('')
      new_i.splice(3,0,'.')
      for(var k=1;k>=0;k--){
        if(new_i[k]=='0'){
          new_i.splice(k,1)
        }
      }
      const string_i = new_i.join("")
      i.splice(2,1,parseFloat(string_i))

      const old_date = i[4].toString()
      const first_2_date = old_date.substring(0,2)
      const middle_2_date = old_date.substring(2,4)
      const last_2_date = old_date.substring(4)
      const new_date = last_2_date.concat(middle_2_date,first_2_date)

      i.splice(4,1,new_date)

      
    }
    res.send(result)

})

app.get('/parse_primo', (req, res) => {
    
    const result = xlsx.parse(`${__dirname}/New_primo_2.xlsx`);
    console.log(result)
    res.send(result[0]['data'].slice(1))


})

app.get('/upload_primo',(req,res)=>{

    axios.get('http://localhost:3002/parse_primo').then(resp => {

    console.log(resp.data);

    var sgx_data = resp.data

    axios.post('http://localhost:3000/create_primo', sgx_data)
      .then(function (response) {
        console.log(response);
        res.send(response.data)
      })
});
   
})

app.get('/upload_sgx',(req,res)=>{

    axios.get('http://localhost:3002/parse_sgx').then(resp => {

    console.log(resp.data);

    var sgx_data = resp.data

    axios.post('http://localhost:3000/create_sgx', sgx_data)
      .then(function (response) {
        console.log(response);
        res.send(response.data)
      })
});
   
})

app.get('/update_status_complex',(req,res)=>{
  axios.get('http://localhost:3000/reconcile').then(resp=>{

    const failed_sgx = resp.data['failed_sgx']
    const failed_primo = resp.data['failed_primo']
    const success_sgx = resp.data['reconciled_sgx']
    const success_primo = resp.data['reconciled_primo']

    const failed_sgx_batch = []
    const failed_primo_batch = []
    const success_sgx_batch = []
    const success_primo_batch = []

    for(const set of failed_sgx){
      for(const prop in set){

        var internal_dict = JSON.parse(set[prop])
        for(const k in internal_dict){
          if(k=='ID_list'){
            for(const id of internal_dict[k]){
              console.log(id)

              var new_status_id = {"ID":id,"Status":"fail"}

              failed_sgx_batch.push(new_status_id)
            }
          }
        }
      }
    }

    axios.post('http://localhost:3000/update_sgx_status', failed_sgx_batch)
              .then(function (response) {
                console.log(response);
              })

    for(const set of failed_primo){
      for(const prop in set){

        var internal_dict = JSON.parse(set[prop])
        for(const k in internal_dict){
          if(k=='ID_list'){
            for(const id of internal_dict[k]){
              console.log(id)

              var new_status_id = {"ID":id,"Status":"fail"}

              failed_primo_batch.push(new_status_id)
            }
          }
        }
      }
    }

    axios.post('http://localhost:3000/update_primo_status', failed_primo_batch)
              .then(function (response) {
                console.log(response);
              })

    for(const set of success_sgx){
      for(const prop in set){

        var internal_dict = JSON.parse(set[prop])
        for(const k in internal_dict){
          if(k=='ID_list'){
            for(const id of internal_dict[k]){
              console.log(id)

              var new_status_id = {"ID":id,"Status":"success"}

              success_sgx_batch.push(new_status_id)
            }
          }
        }
      }
    }

    axios.post('http://localhost:3000/update_sgx_status', success_sgx_batch)
              .then(function (response) {
                console.log(response);
              })

    for(const set of success_primo){
      for(const prop in set){

        var internal_dict = JSON.parse(set[prop])
        for(const k in internal_dict){
          if(k=='ID_list'){
            for(const id of internal_dict[k]){
              console.log(id)

              var new_status_id = {"ID":id,"Status":"success"}

              success_primo_batch.push(new_status_id)
            }
          }
        }
      }
    }

    axios.post('http://localhost:3000/update_primo_status', success_primo_batch)
              .then(function (response) {
                console.log(response);
              })
              
    
    res.send('Status of all trades updated') 
    // var test;
    // var object = resp.data['failed_sgx'][0]
    // for (const property in object) {
    //   test = JSON.parse(object[property]);
    // }
    
    // res.send(test);

    // var result = resp.data
    // var parsed_reconcile_result = {}

    // for(const property in result){
    //   parsed_reconcile_result[property] = []
    //   for (const k in result[property]){
    //     // var j = JSON.parse(result[property][k])
    //     console.log(result[property][k])
    //     var dict_to_push = {}
    //     dict_to_push[k] = result[property][k]
    //     parsed_reconcile_result[property].push(dict_to_push)
    //   }
    // }

  })
})

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})