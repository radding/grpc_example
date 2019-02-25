const grpc = require("grpc");
const protoLoader = require("@grpc/proto-loader");

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

//const protoDescriptor = grpc.loadPackageDefinition(definition);
const LibraryService = grpc.load("../protos/library.proto").Library.LibraryService;
const creds = grpc.credentials.createInsecure();


const library = new LibraryService("0.0.0.0:50051", creds);

function CheckoutBook(book) {
  library.CheckoutBook(book, (err, result) => {
    if (err) {
      console.log("ERROR:", err);
      return;
    }
    if (result.didCheckout) {
      console.log(`congrats, you rented ${result.book.title}!`);
    } else {
      console.log(`unfortunately, someone else rented ${result.book.title}.`);
    }
  });
}

function CheckAvailibilty(book) {
  library.CheckAvailibilty(book, (err, result) => {
    if (err) {
      console.log("ERROR:", err);
      return;
    }
    if (result.isAvailable) {
      console.log(`Yes, ${result.book.title} is available!`);
    } else {
      console.log(`No, ${result.book.title} is not available.`);
    }
  });
}

function WaitFor(book) {
  const call = library.WaitFor(book);
  call.on('data', (status) => {
    if (status.didCheckout) {
      console.log(`You just checked out ${status.book.title}!`);
    } else {
      console.log(`Still waiting for a copy of ${status.book.title} :(`);
    }
  });

  call.on("end", () => {
    console.log("Congratulations!");
  })

  call.on("error", (e) => {
    console.log("ERROR:", e);
  });
}

function Return(book) {
  library.ReturnBook(book, (error, empty) => {
    if(error) {
      console.log("ERROR:", error);
      return;
    }
    console.log(`${book.title} has been returned`);
  });
}

function StartSearch() {
  const call = library.Search();

  call.on("data", (data) => {
    console.table(data.books);
  });

  const search = (searchCriteria) => {
    call.write(searchCriteria);
  }
  call.on("end", () => console.log("server ended the stream!"));
  search.end = () => call.end();
  return search;
}

module.exports = {
  CheckoutBook,
  CheckAvailibilty,
  WaitFor,
  Return,
  StartSearch,
}

