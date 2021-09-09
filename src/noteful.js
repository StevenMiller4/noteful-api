require('dotenv').config()

const knex = require('knex')
const FoldersService = require('./folders/folders-service')
//const NotesService = require('./notes/notes-service')

const knexInstance = knex({
    client: 'pg',
    connection: process.env.DB_URL,
})

FoldersService.getAllFolders(knexInstance)
    .then(folders => console.log(folders))
    .then(() => 
        FoldersService.insertFolder(knexInstance, {
            name: 'New name',
            date_added: new Date(),
        })
    )
    .then(newFolder => {
        console.log(newFolder)
        return FoldersService.updateFolder(
            knexInstance,
            newFolder.id,
            { name: 'Updated name' }
        ).then(() => FoldersService.getById(knexInstance, newFolder.id))
    })
    .then(folder => {
        console.log(folder)
        return FoldersService.deleteFolder(knexInstance, folder.id)
    })