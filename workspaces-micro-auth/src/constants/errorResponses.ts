const ERROR_RESPONSES = {
    AUTHERR000: {
      errorCode: "AUTHERR000",
      errorMessage: "Internal Server Error",
    },
    AUTHERR001: {
      errorCode: "AUTHERR001",
    },
    AUTHERR002: {
      errorCode: "AUTHERR002",
      errorMessage: "Session Id Required!",
    },
    AUTHERR003: {
      errorCode: "AUTHERR003",
      errorMessage: "Client does not exists with specified credentials!",
    },
    AUTHERR004: {
      errorCode: "AUTHERR004",
      errorMessage: "Client with this name already exists!",
    },
    AUTHERR005: {
        errorCode: "AUTHERR005",
        errorMessage: "Client Id Required!",
    },
    AUTHERR006: {
      errorCode: "AUTHERR006",
      errorMessage: "Client does not exists!",
    },
  };
  
  export { ERROR_RESPONSES };