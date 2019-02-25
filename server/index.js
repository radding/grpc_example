const grpc = require("grpc");
const protoLoader = require("@grpc/proto-loader");


const bookRepo = require("./books.json");

let notifySearch = null;

function CheckoutBook(book) {
  const indexOfBook = bookRepo.books.findIndex( elem  => {
    return elem.id === book.id && elem.title === book.title;
  });
  let didCheckout = false;
  const bookToCheckout = bookRepo.books[indexOfBook];
  if (bookToCheckout.isAvailable) {
    console.log("Someone is checking out a book:", book.title);
    bookToCheckout.isAvailable = false;
    bookRepo.books[indexOfBook] = bookToCheckout;
    didCheckout = true;
    notifySearch && notifySearch( {book: bookToCheckout, state: "0" });
  }
  return {
    book: bookToCheckout,
    didCheckout,
  }
}

function CheckAvailibilty(book) {
  const myBook = bookRepo.books.find( elem  => {
    return elem.id === book.id && elem.title === book.title;
  });

  console.log(`Someone is checking if ${book.title} is available. It is${myBook.isAvailable ? "" : " not"}!`);
  return {
    book: myBook,
    isAvailable: myBook.isAvailable,
  }
}

function WaitFor(data) {
  console.log("Someone is waiting for a book:", data.request.title);

  const doWait = (book, call) => {
    setTimeout(() => {
      const indexOfBook = bookRepo.books.findIndex( elem  => {
        return elem.id === book.id && elem.title === book.title;
      });
      console.log(book);
      console.log(indexOfBook);
      const myBook = bookRepo.books[indexOfBook];
      if (myBook.isAvailable) {
        myBook.isAvailable = false;
        bookRepo.books[indexOfBook] = myBook;
        call.write({
          book,
          didCheckout: true,
        });
        notifySearch && notifySearch( {book, state: "0" });
        call.end();
      } else {
        call.write({
          book,
          didCheckout: false,
        });
        const didEnd = doWait(book, call);
      }
    }, 500)
  }
  doWait(data.request, data)
}

function ReturnBook(book) {
  const indexOfBook = bookRepo.books.findIndex( elem  => {
    return elem.id === book.id && elem.title === book.title;
  });
  const bookToCheckout = bookRepo.books[indexOfBook];
  bookToCheckout.isAvailable = true;
  bookRepo.books[indexOfBook] = bookToCheckout;
  notifySearch && notifySearch( {book: bookToCheckout, state: "1" });
}

function Search(call) {
  console.log("Someone is initializing a search!");
  call.on("data", (bookRequest) => {
    console.log(bookRequest);
    let books = bookRepo.books;
    if (bookRequest.title) {
      books = books.filter((book) => !!book.title.match(new RegExp(bookRequest.title)))
    }
    if (bookRequest.author) {
      books = books.filter((book) => !!book.author.match(new RegExp(bookRequest.author)))
    }
    if (bookRequest.genre) {
      books = books.filter((book) => !!book.genre.match(new RegExp(bookRequest.genre)))
    }
    if (bookRequest.onlyAvailable) {
      books = books.filter((book) => book.isAvailable);
    }
    call.write({ books, state: "2" });
  });
  call.on('end', () => {
    notifySearch = null;
    call.end();
  });
  notifySearch = (message) => call.write({books: [ message.book ], state: message.state });
}

const definition = protoLoader.loadSync(
  __dirname + '/../protos/library.proto',
  {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    opeofs: true,
  }
);

const protoDescriptor = grpc.loadPackageDefinition(definition);
const library = protoDescriptor.Library;

const server = new grpc.Server();
server.addProtoService(library.LibraryService.service, {
  CheckoutBook: (call, cb) => cb(null, CheckoutBook(call.request)),
  CheckAvailibilty: (call, cb) => cb(null, CheckAvailibilty(call.request)),
  WaitFor: WaitFor,
  ReturnBook: (call, cb) => cb(null, ReturnBook(call.request)),
  Search: Search,
});
server.bind("0.0.0.0:50051", grpc.ServerCredentials.createInsecure());
server.start();

