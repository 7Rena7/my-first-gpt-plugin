import express, { json } from 'express'
import cors from 'cors'
import fs from 'node:fs/promises'
import path from 'node:path'
import crypto from 'node:crypto'

const PORT = process.env.PORT ?? 3000
const app = express()

app.use(cors(
    {
        origin: [`http://localhost:${PORT}`, `http://chat.openai.com`]
    }
))

// Use middleware json to parse all the requests received so we don't have to do it individually
app.use(json())

// NOTE: app.use indicates that all the request that we receive in out API, will go through the middleware inside it
app.use((req, res, next) => {
    console.log(`Request received: ${req.method} ${req.url}`)
    next()
})

// 1. Preparar los endpoints para servir la información 
// que necesita el plugin de chatGPT
app.get('/openapi.yaml', async (req, res, next) => {
    try {
        const filePath = path.join(process.cwd(), 'openapi.yaml')
        const yamlData = await fs.readFile(filePath, 'utf-8')
        res.setHeader('Content-Type', 'text/yaml')
        res.send(yamlData)
    } catch (e) {
        console.error(e.message)
        res.status(500).send({error: 'Unable to fetch openapi.yaml manifest'})
    }
})

app.get('/well-known/ai-plugin.json', (req, res) => {
    res.sendFile(path.join(process.cwd(), '.well-known/ai-plugin.json'))
})

app.get('/logo.png', (req, res) => {
    res.sendFile(path.join(process.cwd(), 'logo.png'))
})

// 2. Endpoints de la API
// para que funcione el plugin de ChatGPT con los todos

// Aquí podríamos agregar persistencia en base de datos
// o lo que queramos realmente, vamos a mantenerlo simple
// por ahora
let TODOS = [
    { id: crypto.randomUUID(), title: 'Ir al super' },
    { id: crypto.randomUUID(), title: 'Crear un plugin de ChatGPT' },
    { id: crypto.randomUUID(), title: 'Aprender cosas nuevas :)' },
    { id: crypto.randomUUID(), title: 'Divertirse saliendo a tomar algo' },
]

const emptyTodo = {id: '', title: ''}

app.get('/todos', (req, res) => {
    return res.status(200).json({todos: TODOS})
})

app.post('/todos', (req, res) => {
    const { title } = req.body
    const newTodo = { id: crypto.randomUUID(), title: title.title }
    TODOS.push(newTodo)
    return res.status(201).json(newTodo)
})

app.get('/todos/:id', (req, res) => {
    const { id } = req.params
    const todo = TODOS.find(todo => todo.id = id)
    if (todo) {
        return res.status(200).json(todo)
    } else {
        return res.status(404).json(emptyTodo)
    }
})

app.put('/todos/:id', (req, res) => {
    const { id } = req.params
    const { title } = req.body

    let updatedTodo = null;

    TODOS = TODOS.map(todo => {
        if(todo.id === id) {
            updatedTodo = {...todo, title}
            return updatedTodo
        }

        return todo
    })
    return res.status(200).json(updatedTodo)
})

app.delete('/todos/:id', (req, res) => {
    const { id } = req.params

    TODOS = TODOS.filter(todo => { todo.id !== id })

    return res.status(200).json({ok: true})
})

// 3. Iniciar el servidor
app.listen(PORT, () => {
    console.log(`Chat GPT Plugin is listening in port: ${PORT}`)
})