const FoldersService = require('../src/folders/folders-service')
const knex = require('knex')
const { expect } = require('chai')

describe(`Folders service object`, function() {

    let db

    let testFolders = [
        {
            id: 1,
            name: 'First Folder',
            date_added: new Date('2029-01-22T16:28:32.615Z')
        },
        {
            id: 2,
            name: 'Second Folder',
            date_added: new Date('2100-05-22T16:28:32.615Z')
        },
        {
            id: 3,
            name: 'Third Folder',
            date_added: new Date('1919-12-22T16:28:32.615Z')
        },
    ]

    before(() => {
        db = knex({
            client: 'pg',
            connection: process.env.TEST_DATABASE_URL,
        })
    })

    before(() => db('noteful_folders').truncate())

    afterEach(() => db('noteful_folders').truncate())

    after(() => db.destroy())

    context(`Given 'noteful_folders' has data`, () => {
        
        beforeEach(() => {
            return db
                .into('noteful_folders')
                .insert(testFolders)
        })

        it(`getAllFolders() resolves all folders from 'noteful_folders`, () => {
            return FoldersService.getAllFolders(db)
                .then(actual => {
                    expect(actual).to.eql(testFolders)
                })
        })

        it(`getById() resolves a folder by id from 'noteful_folders' table`, () => {
            const thirdId = 3
            const thirdTestFolder = testFolders[thirdId - 1]
            return FoldersService.getById(db, thirdId)
                .then(actual => {
                    expect(actual).to.eql({
                        id: thirdId,
                        name: thirdTestFolder.name,
                        date_added: thirdTestFolder.date_added,
                    })
                })
        })

        it(`deleteFolder() removes an article by id from 'noteful_folders' table`, () => {
            const folderId = 3
            return FoldersService.deleteFolder(db, folderId)
                .then(() => FoldersService.getAllFolders(db))
                .then(allFolders => {
                    const expected = testFolders.filter(folder => folder.id !== folderId)
                    expect(allFolders).to.eql(expected)
                })
        })

        it(`updateFolder() updates a folder from 'noteful_folders' table`, () => {
            const idOfFolderToUpdate = 3
            const newFolderData = {
                name: 'updated name',
                date_added: new Date(),
            }
            return FoldersService.updateFolder(db, idOfFolderToUpdate, newFolderData)
                .then(() => FoldersService.getById(db, idOfFolderToUpdate))
                .then(folder => {
                    expect(folder).to.eql({
                        id: idOfFolderToUpdate,
                        ...newFolderData,
                    })
                })
        })

    })

    context(`Given 'noteful_folders' has no data`, () => {
        
        it(`getAllFolders() resolves an empty array`, () => {
            return FoldersService.getAllFolders(db)
                .then(actual => {
                    expect(actual).to.eql([])
                })
        })

        it(`insertFolder() inserts a new folder and resolves the folder with an 'id'`, () => {
            const newFolder = {
                name: 'Test new title',
                date_added: new Date('2020-01-01T00:00:00.000Z')
            }
            return FoldersService.insertFolder(db, newFolder)
                .then(actual => {
                    expect(actual).to.eql({
                        id: 1,
                        name: newFolder.name,
                        date_added: newFolder.date_added,
                    })
                })
        })

    })

})