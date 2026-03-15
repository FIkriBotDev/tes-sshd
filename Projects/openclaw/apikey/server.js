const express = require("express")
const axios = require("axios")

const app = express()
app.use(express.json())

const PORT = 2026

// API key lokal
const LOCAL_API_KEY = "EX_IT8Fj1rDIEbvYKzxAlFCbWJ1tMNxjBT0"

// API key pollinations
const POLLINATIONS_KEY = "sk_IT8Fj1rDIEbvYKzxAlFCbWJ1tMNxjBT0"


// middleware log request
app.use((req,res,next)=>{
 console.log(req.method,req.url)
 next()
})


// root endpoint
app.get("/",(req,res)=>{
 res.send("AI Gateway Running")
})


// v1 root
app.get("/v1",(req,res)=>{
 res.json({
  object:"api",
  message:"OpenAI compatible gateway"
 })
})


// list models
app.get("/v1/models",(req,res)=>{
 res.json({
  object:"list",
  data:[
   {
    id:"openai",
    object:"model",
    created:0,
    owned_by:"pollinations"
   }
  ]
 })
})


// model detail
app.get("/v1/models/:id",(req,res)=>{
 res.json({
  id:req.params.id,
  object:"model",
  created:0,
  owned_by:"pollinations"
 })
})


// chat completions
app.post("/v1/chat/completions",async(req,res)=>{

 try{

  const auth = req.headers.authorization

  if(!auth || auth !== `Bearer ${LOCAL_API_KEY}`){
   return res.status(401).json({error:"Invalid API key"})
  }

  let body = req.body

  if(!body.messages || body.messages.length === 0){
   body.messages = [{role:"user",content:"hello"}]
  }

  body.stream = false

  const response = await axios.post(
   "https://gen.pollinations.ai/v1/chat/completions",
   body,
   {
    headers:{
     "Authorization":`Bearer ${POLLINATIONS_KEY}`,
     "Content-Type":"application/json"
    }
   }
  )

  const data = response.data

  const normalized = {
   id:data.id || "chatcmpl-local",
   object:"chat.completion",
   created:data.created || Math.floor(Date.now()/1000),
   model:data.model || body.model,
   choices:[
    {
     index:0,
     message:{
      role:"assistant",
      content:data.choices?.[0]?.message?.content || ""
     },
     finish_reason:"stop"
    }
   ],
   usage:data.usage || {
    prompt_tokens:0,
    completion_tokens:0,
    total_tokens:0
   }
  }

  res.json(normalized)

 }catch(err){

  console.log("PROXY ERROR:")
  console.log(err.response?.data || err.message)

  res.status(500).json({
   error:"Gateway error"
  })

 }

})


// start server
app.listen(PORT,()=>{
 console.log(`AI Gateway running`)
 console.log(`http://localhost:${PORT}/v1`)
})
