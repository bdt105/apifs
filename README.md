# apifs

Based on nodejs and express.
Write, read, delete a file.
The file is create in a directory. If directory does not exist then it is created.

## Dependencies
https://github.com/bdt105/modules/tree/master/toolbox

## Configuration
Configure configuration.json if you wish to change port.

## POST /
Reads a file.
If fileName is empty or absent then the api retreives the list of files of the directory.

```
POST example
{
	"directory": "directory",
	"fileName": "test.txt"
}
```

## DELETE /
Deletes a file

```
POST example
{
	"directory": "directory",
	"fileName": "test.txt"
}
```

## PUT /
Writes a file

```
POST example
{
	"directory": "directory",
	"fileName": "test.txt",
    "content": "toto xxx fffd"
}
```

## PATCH /
Appends content at the end of a file

```
POST example
{
	"directory": "directory",
	"fileName": "test.txt",
    "content": "toto xxx fffd"
}
```