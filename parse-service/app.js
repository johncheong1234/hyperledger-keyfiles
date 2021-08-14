const express = require('express')
const app = express()
const cors = require('cors');
app.use(cors({
    origin: '*'
}));
const fileUpload = require('express-fileupload');
const port = 3002
var xlsx = require('node-xlsx').default;

const axios = require('axios')

app.use(fileUpload());

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.get('/parse_sgx', (req, res) => {
    
    const resulty = xlsx.parse(`${__dirname}/sgx.xlsx`);
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
    
    const result = xlsx.parse(`${__dirname}/primo.xlsx`);
    console.log(result)
    res.send(result[0]['data'].slice(1))


})

app.post('/upload_sgx_complex',(req,res)=>{

  let sgx;
  let uploadPath;

  if (!req.files || Object.keys(req.files).length === 0) {
    return res.status(400).send('No files were uploaded.');
  }

  uploadPath = __dirname + '/' + 'sgx.xlsx';
  sgx = req.files.myFile;

  
  sgx.mv(uploadPath, function(err) {
    if (err)
      return res.status(500).send(err);

    // res.send('File uploaded!');
    axios.get('http://localhost:3002/parse_sgx').then(resp => {

      console.log(resp.data);
  
      var sgx_data = resp.data
  
      axios.post('http://localhost:3000/create_sgx', sgx_data)
        .then(function (response) {
          console.log(response);
          res.send(response.data)
        })
  });
  });
})

app.post('/upload_primo_complex',(req,res)=>{

  let primo;
  let uploadPath;

  if (!req.files || Object.keys(req.files).length === 0) {
    return res.status(400).send('No files were uploaded.');
  }

  uploadPath = __dirname + '/' + 'primo.xlsx';
  primo = req.files.myFile;

  
  primo.mv(uploadPath, function(err) {
    if (err)
      return res.status(500).send(err);

      axios.get('http://localhost:3002/parse_primo').then(resp => {

        console.log(resp.data);
    
        var sgx_data = resp.data
    
        axios.post('http://localhost:3000/create_primo', sgx_data)
          .then(function (response) {
            console.log(response);
            res.send(response.data)
          })
    });
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
  
  })
})

app.get('/create_reconcile_complex',function(request,response){
	axios.get('http://localhost:3000/reconcile_2').then(resp=>{

    const block_trades = []

    var reconciled_sgx = resp.data['reconciled_sgx']
    var reconciled_primo = resp.data['reconciled_primo']

    for(const s_block of reconciled_sgx){
      const block_dict = {}
      for(const s_id in s_block){
        const sgx_q_id = JSON.parse(s_block[s_id])
        const quantity = sgx_q_id['Quantity']
        const sgx_id = sgx_q_id['ID_list']
        block_dict['recon_id'] = s_id;
        block_dict['Quantity'] = quantity;
        block_dict['SGX_ID'] = sgx_id;

        for(const p_block of reconciled_primo){
          if(s_id in p_block){
            const primo_q_id = JSON.parse(p_block[s_id])
            block_dict['PRIMO_ID'] = primo_q_id['ID_list']
          }
        }

        block_trades.push(block_dict)
      }
    }

    axios.post('http://localhost:3000/create_reconcile', block_trades)
        .then(function (resp) {
          console.log(resp);
          response.send(resp.data)
        })

    // response.send(JSON.stringify(block_trades))
  })
})

app.get('/transform_reconcile', (req,res)=>{
  axios.get('http://localhost:3000/read_reconcile').then(resp=>{
    const value = resp['data']
    var sgx_list = []
		var primo_list = []

		for(const item of value){

			const sgx_ID_list = item['Record']['sgx_list'].split(',')

			for(const id_q_string of sgx_ID_list){

				const sgx_dict = {}

        const id_q = id_q_string.split('_')

				sgx_dict['Block_ID'] = item['Record']['Block_ID']

				sgx_dict['ID'] = id_q[0]

				console.log(sgx_dict)
				sgx_list.push(sgx_dict)
			}
		}

		for(const item of value){

			const primo_ID_list = item['Record']['Primo_list'].split(',')

			for(const id_q_string of primo_ID_list){

				const primo_dict = {}

        const id_q = id_q_string.split('_')

				primo_dict['Block_ID'] = item['Record']['Block_ID']

				primo_dict['ID'] = id_q[0]

				console.log(primo_dict)
				primo_list.push(primo_dict)
			}
		}

		res.send({sgx_list: sgx_list, primo_list: primo_list})
  })
})

app.get('/update_block_id_complex',(req,res)=>{
  axios.get('http://localhost:3002/transform_reconcile').then(resp=>{

    axios.post('http://localhost:3000/update_sgx_block_id',resp.data['sgx_list']).then(
      axios.post('http://localhost:3000/update_primo_block_id',resp.data['primo_list']).then(
        res.send('Block_IDs updated')
      )
    )
  })
})

app.get('/reconcile_orchestrate',(req,res)=>{
  console.log("Creating reconcile blocks ...")
  axios.get('http://localhost:3002/create_reconcile_complex')
    .then(function (response) {
      console.log(response.data);
      
      console.log("Updating reconcile status ...")
      axios.get('http://localhost:3002/update_status_complex')
        .then(function (response) {
          console.log(response.data);
          
          console.log("Updating Block ID for each individual transaction")
          axios.get('http://localhost:3002/update_block_id_complex').then(
            function(response){
              console.log(response.data)
            }
          )
    })
    })
})

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})