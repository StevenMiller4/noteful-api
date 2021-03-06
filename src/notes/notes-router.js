const path = require('path')
const express = require('express')
const NotesService = require('./notes-service')

const notesRouter = express.Router()
const jsonParser = express.json()

notesRouter
    .route('/')
    .get((req, res, next) => {
        const knexInstance = req.app.get('db')
        NotesService.getAllNotes(knexInstance)
            .then(notes => {
                res.json(notes)
            })
            .catch(next)
    })
    .post(jsonParser, (req, res, next) => {
        const { name, content, folder_id } = req.body
        const newNote = { name, content, folder_id }

        for (const [key, value] of Object.entries(newNote))
            if (value == null) {
                return res.status(400).json({
                    error: { message: `Missing '${key}' in request` }
                })
            }

        newNote.folder_id = folder_id;
        newNote.date_modified = new Date();
        
        NotesService.insertNote(
            req.app.get('db'),
            newNote
        )
            .then(note => {
                res
                    .status(201)
                    .location(path.posix.join(req.originalUrl, `${note.id}`))
                    .json(note)
            })
            .catch(next)
    })

notesRouter
    .route('/:noteId')
    .all((req, res, next) => {
        NotesService.getById(
            req.app.get('db'),
            req.params.noteId
        )
            .then(note => {
                if (!note) {
                    return res.status(404).json({
                        error: { message: `Note doesn't exist` }
                    })
                }
                res.note = note
                next()
            })
            .catch(next)
    })
    .get((req, res, next) => {
        res.json(note)
    })
    .delete((req, res, next) => {
        NotesService.deleteNote(
            req.app.get('db'),
            req.params.noteId
        )
            .then(
                res.status(204).end()
            )
            .catch(next)
    })
    .patch(jsonParser, (req, res, next) => {
        const { name, content, date_modified } = req.body
        const noteToUpdate = { name, content, date_modified }

        const numberOfValues = Object.values(noteToUpdate).filter(Boolean).length
        if (numberOfValues === 0) {
            return res.status(400).json({
                error: {
                    message: `Request body must contain 'name', 'content', or 'folder_id'`
                }
            })
        }

        NotesService.updateNote(
            req.app.get('db'),
            req.params.noteId,
            noteToUpdate
        )
            .then(numRowsAffected => {
                res.status(204).end()
            })
            .catch(next)
    })

module.exports = notesRouter