process.env.NODE_ENV = "test";

const request = require('supertest');

const app = require('../app')
const db = require('../db');

describe('Test books routes', function() {
    
    let bookISBN;

    beforeEach(async () => {
        let results = await db.query(
            `INSERT INTO books (isbn, amazon_url, author, language, pages, publisher, title, year)
            VALUES (
            '123456789',
            'https://amazon.com/dog',
            'Billy',
            'English',
            123,
            'No publisher',
            'The dog book',
            2001)
            RETURNING isbn`);
        bookISBN = results.rows[0].isbn
    });

    afterEach(async () => {
        await db.query("DELETE FROM books");
    });
    
    afterAll(async () => {
        await db.end()
    });


    describe("GET /books", function(){
        test ("Get a list of one book", async () => {
            const response = await request(app)
            .get("/books");
            let books = response.body.books;
            expect(response.statusCode).toEqual(200);
            expect(books).toHaveLength(1);
            expect(books[0]).toHaveProperty("isbn");
            expect(books[0]).toHaveProperty("amazon_url");
        });
    });

    describe("GET /books/:isbn", function () {
        test("Get a book from its isbn", async () => {
            const response = await request(app)
            .get(`/books/${bookISBN}`);
            let books = response.body.book;
            expect(response.statusCode).toBe(200);
            expect(books).toHaveProperty('isbn');
            expect(books.isbn).toBe(bookISBN);
        });

        test("Respond with 404 if book can't be found", async () => {
            const response = await request(app)
            .get('/books/123');
            expect(response.statusCode).toBe(404);
        });
    });

    describe("POST /books", function () {
        test("Creates a new book", async function () {
          const response = await request(app)
              .post(`/books`)
              .send({
                isbn: '12345678',
                amazon_url: "https://example.com",
                author: "Mr Example",
                language: "english",
                pages: 1000,
                publisher: "Example press",
                title: "The example book",
                year: 2009
              });
              let books = response.body.book;
          expect(response.statusCode).toBe(201);
          expect(books).toHaveProperty("isbn");
        });

        test("Required title to create books", async () => {
            const response = await request(app)
            .post('/books')
            .send({year: 2003});
            expect(response.statusCode).toBe(400);
        });
    });

    describe("PUT /books/:isbn", function () {
        test("Updates a book", async () => {
            const response = await request(app)
            .put(`/books/${bookISBN}`)
            .send({
                amazon_url: "https://example.com",
                author: "Mr Example",
                language: "english",
                pages: 1000,
                publisher: "Example press",
                title: "Updated Book",
                year: 2009
            });
            
        expect(response.body.book).toHaveProperty('isbn');
        expect(response.body.book.title).toBe("Updated Book");
        });

        test("Bad update", async () => {
            const response = await request(app)
            .put(`/books/${bookISBN}`)
            .send({
                isbn: '12345678',
                partner:"BAD UPDATE",
                amazon_url: "https://example.com",
                author: "Mr Example",
                language: "english",
                pages: 1000,
                publisher: "Example press",
                title: "Updated Book",
                year: 2009
            });
            expect(response.statusCode).toBe(400)
        })
    });

    describe("DELETE /books/:isbn", function () {
        test("DELETE a book", async () => {
            const response = await request(app)
            .delete(`/books/${bookISBN}`)
            expect(response.body).toEqual({message:"Book deleted"})
        });
    });
});