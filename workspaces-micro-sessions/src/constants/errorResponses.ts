const AGENT_ERROR_RESPONSES = {
  AGENTERR000: {
    errorCode: "AGENTERR000",
    errorMessage: "Internal Server Error",
  },
  AGENTERR001: {
    errorCode: "AGENTERR001",
  },
  AGENTERR002: {
    errorCode: "AGENTERR002",
    errorMessage: "Agent Id Required!",
  },
  AGENTERR003: {
    errorCode: "AGENTERR003",
    errorMessage: "Agent does not exists!",
  },
  AGENTERR004: {
    errorCode: "AGENTERR004",
    errorMessage: "Agent with this host and port already exists!",
  },
  AGENTERR005: {
    errorCode: "AGENTERR005",
    errorMessage: "No Agents Found!",
  },
};

const SESSION_ERROR_RESPONSES = {
  SESSERR000: {
    errorCode: "SESSERR000",
    errorMessage: "Internal Server Error",
  },
  SESSERR001: {
    errorCode: "SESSERR001",
  },
  SESSERR002: {
    errorCode: "SESSERR002",
    errorMessage: "Session Id Required!",
  },
  SESSERR003: {
    errorCode: "SESSERR003",
    errorMessage: "Session does not exists!",
  },
  SESSERR004: {
    errorCode: "SESSERR004",
    errorMessage: "Session already exists!",
  },
  SESSERR005: {
    errorCode: "SESSERR005",
    errorMessage: "Participant does not exists!",
  },
  SESSERR006: {
    errorCode: "SESSERR006",
    errorMessage: "Client Id Required!",
  },
  SESSERR007: {
    errorCode: "SESSERR007",
    errorMessage: "No Sessions Found!",
  },
  SESSERR008: {
    errorCode: "SESSERR008",
    errorMessage: "Session Concurrency Limit Exceeded!",
  },
};

const IMAGE_ERROR_RESPONSES = {
  IMAGEERR000: {
    errorCode: "IMAGEERR000",
    errorMessage: "Internal Server Error",
  },
  IMAGEERR001: {
    errorCode: "IMAGEERR001",
  },
  IMAGEERR002: {
    errorCode: "IMAGEERR002",
    errorMessage: "Image Id Required!",
  },
  IMAGEERR003: {
    errorCode: "IMAGEERR003",
    errorMessage: "Image does not exists!",
  },
  IMAGEERR004: {
    errorCode: "IMAGEERR004",
    errorMessage: "Image already exists!",
  },
  IMAGEERR005: {
    errorCode: "IMAGEERR005",
    errorMessage: "No Images Found!",
  },
  IMAGEERR006: {
    errorCode: "IMAGEERR006",
    errorMessage: "Image already exists with this name!",
  },
};

export {
  AGENT_ERROR_RESPONSES,
  SESSION_ERROR_RESPONSES,
  IMAGE_ERROR_RESPONSES,
};
