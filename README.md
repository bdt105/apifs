# apifs

Based on nodejs and express.
Write, read, delete a file.

## POST /fs/get
Reads a file

POST example
{
	"name": "name",
	"fileName": "test.txt"
}

## DELETE /fs/delete
Deletes a file

POST example
{
	"name": "name",
	"fileName": "test.txt"
}

## PUT /fs/put
Writes a file

POST example
{
	"name": "name",
	"fileName": "test.txt",
    "content": "toto xxx fffd"
}