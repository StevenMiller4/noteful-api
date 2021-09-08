require('dotenv').config()
const knex = require('knex')
const FoldersService = require('./folders/folders-service')
const NotesService = require('./notes/notes-service')

const knexInstance = knex({
    client: 'pg',
    connection: process.env.DB_URL,
})

