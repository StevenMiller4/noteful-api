const { expect } = require('chai')
const knex = require('knex')
const supertest = require('supertest')
const app = require('../src/app')
const { makeFoldersArray } = require('./folders.fixtures')

describe(`Folders Endpoints`, function () {
    
    let db

    before(`make knex instance`, () => {
        db = knex({
            client: 'pg',
            connection: process.env.TEST_DATABASE_URL,
        })
        app.set('db', db)
    })

    after(`disconnect from db`, () => db.destroy())

    before(`clean the table`, () => db('noteful_folders').truncate())

    afterEach(`cleanup`, () => db('noteful_folders').truncate())

    describe(`GET /api/folders`, () => {

        context(`Given no folders`, () => {

            it(`responds with 200 and an empty list`, () => {
                return supertest(app)
                    .get('/api/folders')
                    .expect(200, [])
            })

        })

        context(`Given there are folders in the database`, () => {

            const testFolders = makeFoldersArray()

            beforeEach('insert folders', () => {
                return db
                    .into('noteful_folders')
                    .insert(testFolders)
            })

            it(`GET /api/folders responds with 200 and all of the folders`, () => {
                return supertest(app)
                    .get('/api/folders')
                    .expect(200, testFolders)
            })

        })
    
    })

    describe(`GET /api/folders/:folder_id`, () => {

        context(`Given no folders`, () => {

            it(`responds with 404`, () => {
                const folderId = 123456
                return supertest(app)
                    .get(`/api/folders/${folderId}`)
                    .expect(404, { error: { message: `Folder doesn't exist` } })
            })

        })

        context(`Given there are folders in the database`, () => {

            const testFolders = makeFoldersArray()

            beforeEach('insert folders', () => {
                return db
                    .into('noteful_folders')
                    .insert(testFolders)
            })

            it(`responds with 200 and the specified folder`, () => {
                const folderId = 2
                const expectedFolder = testFolders[folderId - 1]
                return supertest(app)
                    .get(`/api/folders/${folderId}`)
                    .expect(200, expectedFolder)
            })
        
        })

    })

    describe(`POST /api/folders`, () => {

        it(`creates a folder, responding with 201 and the new folder`, function() {
            this.retries(3)
            const newFolder = {
                name: 'Test new folder',
            }
            return supertest(app)
                .post('/api/folders')
                .send(newFolder)
                .expect(201)
                .expect(res => {
                    expect(res.body.name).to.eql(newFolder.name)
                    expect(res.body).to.have.property('id')
                    expect(res.headers.location).to.eql(`/api/folders/${res.body.id}`)
                    const expected = new Date().toLocaleString('en', { timeZone: 'UTC' })
                    const actual = new Date(res.body.date_added).toLocaleString('en', { timeZone: 'UTC' })
                    expect(actual).to.eql(expected)
                })
                .then(postRes => 
                    supertest(app)
                        .get(`/api/folders/${postRes.body.id}`)
                        .expect(postRes.body)    
                )
        })

            it(`responds with 400 and an error message when the 'name' is missing`, () => {
                return supertest(app)
                    .post('/api/folders')
                    .send({})
                    .expect(400, {
                        error: { message: `Missing 'name' in request body` }
                    })
            })

    })

    describe(`DELETE /api/folders/:folder_id`, () => {

        context(`Given no folders`, () => {

            it(`responds with 404`, () => {
                const folderId = 123456
                return supertest(app)
                    .delete(`/api/folders/${folderId}`)
                    .expect(404, { error: { message: `Folder doesn't exist` } })
            })

        })

        context(`Given there are folders in the database`, () => {
            const testFolders = makeFoldersArray()

            beforeEach(`insert folders`, () => {
                return db
                    .into('noteful_folders')
                    .insert(testFolders)
            })

            it(`responds with 204 and removes the folder`, () => {
                const idToRemove = 2
                const expectedFolders = testFolders.filter(folder => folder.id !== idToRemove)
                return supertest(app)
                    .delete(`/api/folders/${idToRemove}`)
                    .expect(204)
                    .then(res => 
                        supertest(app)
                            .get(`/api/folders`)
                            .expect(200)
                    )
            })
        })

    })

    describe(`PATCH /api/folders/:folder_id`, () => {

        context(`Given no folders`, () => {

            it(`responds with 404`, () => {
                const folderId = 123456
                return supertest(app)
                    .patch(`/api/folders/${folderId}`)
                    .expect(404, { error: { message: `Folder doesn't exist` } })
            })

        })

        context(`Given there are folders in the database`, () => {

            const testFolders = makeFoldersArray()

            beforeEach(`insert folders`, () => {
                return db
                    .into('noteful_folders')
                    .insert(testFolders)
            })

            it(`responds with 204 and updates the folder`, () => {
                const idToUpdate = 2
                const updateFolder = {
                    name: 'updated name'
                }
                const expectedFolder = {
                    ...testFolders[idToUpdate - 1],
                    ...updateFolder
                }
                return supertest(app)
                    .patch(`/api/folders/${idToUpdate}`)
                    .send(updateFolder)
                    .expect(204)
                    .then(res =>
                        supertest(app)
                            .get(`/api/folders/${idToUpdate}`)
                            .expect(expectedFolder)
                    )
            })

            it(`responds with 400 when no fields are supplied`, () => {
                const idToUpdate = 2
                return supertest(app)
                    .patch(`/api/folder/${idToUpdate}`)
                    .send({ irrelvantField: 'foo' })
                    .expect(400, {
                        error: {
                            message: `Request body must contain 'name'`
                        }
                    })
            })

        })

    })

})