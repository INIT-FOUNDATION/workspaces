openapi: 3.0.3
info:
  title: WORKSPACES
  version: 1.0.0
  contact: {}
servers:
  - url: http://localhost
paths:
  /api/v1/auth/client:
    post:
      tags:
        - AUTH
      summary: Create Client
      description: Create Client
      operationId: createClient
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                accessExpiryDate:
                  type: string
                  example: '2024-05-30'
                clientName:
                  type: string
                  example: BAMBINOS
                sessionConcurrencyLimit:
                  type: number
                  example: 10
                sessionsLimit:
                  type: number
                  example: 100
            examples:
              Create Client:
                value:
                  accessExpiryDate: '2024-05-30'
                  clientName: BAMBINOS
                  sessionConcurrencyLimit: 10
                  sessionsLimit: 100
      responses:
        '200':
          description: ''
  /api/v1/auth/token:
    post:
      tags:
        - AUTH
      summary: Generate Token
      description: Generate Token
      operationId: generateToken
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                clientId:
                  type: string
                  example: bambinos-be56ab3917
                clientSecret:
                  type: string
                  example: g24KWRE47sQ3+9SkYh/4RVlMXmc=
            examples:
              Generate Token:
                value:
                  clientId: bambinos-be56ab3917
                  clientSecret: g24KWRE47sQ3+9SkYh/4RVlMXmc=
      responses:
        '200':
          description: ''
  /api/v1/auth/client/bambinos1-1bd51c96ea:
    get:
      tags:
        - AUTH
      summary: Get Client
      description: Get Client
      operationId: getClient
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                accessExpiryDate:
                  type: string
                  example: '2024-05-30'
                clientName:
                  type: string
                  example: BAMBINOS1
                sessionConcurrencyLimit:
                  type: number
                  example: 10
                sessionsLimit:
                  type: number
                  example: 100
            examples:
              Get Client:
                value:
                  accessExpiryDate: '2024-05-30'
                  clientName: BAMBINOS1
                  sessionConcurrencyLimit: 10
                  sessionsLimit: 100
      responses:
        '200':
          description: ''
    put:
      tags:
        - AUTH
      summary: Update Client
      description: Update Client
      operationId: updateClient
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                accessExpiryDate:
                  type: string
                  example: '2024-05-30'
                isActive:
                  type: boolean
                  example: true
                sessionConcurrencyLimit:
                  type: number
                  example: 10
                sessionsLimit:
                  type: number
                  example: 102
            examples:
              Update Client:
                value:
                  accessExpiryDate: '2024-05-30'
                  isActive: true
                  sessionConcurrencyLimit: 10
                  sessionsLimit: 102
      responses:
        '200':
          description: ''
    delete:
      tags:
        - AUTH
      summary: Delete Client
      description: Delete Client
      operationId: deleteClient
      requestBody:
        content:
          application/json:
            examples:
              Delete Client:
                value: ''
      responses:
        '200':
          description: ''
  /api/v1/images/create:
    post:
      tags:
        - SESSIONS
        - IMAGES
      summary: Create Image
      description: Create Image
      operationId: createImage
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                imageName:
                  type: string
                  example: chromium
                imageRepo:
                  type: string
                  example: lscr.io/linuxserver/chromium
            examples:
              Create Image:
                value:
                  imageName: chromium
                  imageRepo: lscr.io/linuxserver/chromium
      responses:
        '200':
          description: ''
  /api/v1/images/0bc2a3bd-6d7b-4161-85ca-10512d4ff74b:
    get:
      tags:
        - SESSIONS
        - IMAGES
      summary: Get Image
      description: Get Image
      operationId: getImage
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                imageName:
                  type: string
                  example: chromium
                imageRepo:
                  type: string
                  example: lscr.io/linuxserver/chromium
            examples:
              Get Image:
                value:
                  imageName: chromium
                  imageRepo: lscr.io/linuxserver/chromium
      responses:
        '200':
          description: ''
    put:
      tags:
        - SESSIONS
        - IMAGES
      summary: Update Image
      description: Update Image
      operationId: updateImage
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                imageName:
                  type: string
                  example: chrome
            examples:
              Update Image:
                value:
                  imageName: chrome
      responses:
        '200':
          description: ''
    delete:
      tags:
        - SESSIONS
        - IMAGES
      summary: Delete Image
      description: Delete Image
      operationId: deleteImage
      requestBody:
        content:
          application/json:
            examples:
              Delete Image:
                value: ''
      responses:
        '200':
          description: ''
  /api/v1/images/list:
    get:
      tags:
        - SESSIONS
        - IMAGES
      summary: List Images
      description: List Images
      operationId: listImages
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                imageName:
                  type: string
                  example: chromium
                imageRepo:
                  type: string
                  example: lscr.io/linuxserver/chromium
            examples:
              List Images:
                value:
                  imageName: chromium
                  imageRepo: lscr.io/linuxserver/chromium
      responses:
        '200':
          description: ''
  /api/v1/agents/create:
    post:
      tags:
        - SESSIONS
        - AGENTS
      summary: Create Agent
      description: Create Agent
      operationId: createAgent
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                agentHost:
                  type: string
                  example: localhost
                agentPort:
                  type: number
                  example: 5002
                sslEnabled:
                  type: boolean
                  example: false
            examples:
              Create Agent:
                value:
                  agentHost: localhost
                  agentPort: 5002
                  sslEnabled: false
      responses:
        '200':
          description: ''
  /api/v1/agents/51ad720a-4e25-46d8-bcb2-fd91d8dcd6d9:
    get:
      tags:
        - SESSIONS
        - AGENTS
      summary: Get Agent
      description: Get Agent
      operationId: getAgent
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                imageName:
                  type: string
                  example: chromium
                imageRepo:
                  type: string
                  example: lscr.io/linuxserver/chromium
            examples:
              Get Agent:
                value:
                  imageName: chromium
                  imageRepo: lscr.io/linuxserver/chromium
      responses:
        '200':
          description: ''
    put:
      tags:
        - SESSIONS
        - AGENTS
      summary: Update Agent
      description: Update Agent
      operationId: updateAgent
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                agentPort:
                  type: number
                  example: 8081
            examples:
              Update Agent:
                value:
                  agentPort: 8081
      responses:
        '200':
          description: ''
    delete:
      tags:
        - SESSIONS
        - AGENTS
      summary: Delete Agent
      description: Delete Agent
      operationId: deleteAgent
      requestBody:
        content:
          application/json:
            examples:
              Delete Agent:
                value: ''
      responses:
        '200':
          description: ''
  /api/v1/agents/list:
    get:
      tags:
        - SESSIONS
        - AGENTS
      summary: List Agents
      description: List Agents
      operationId: listAgents
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                imageName:
                  type: string
                  example: chromium
                imageRepo:
                  type: string
                  example: lscr.io/linuxserver/chromium
            examples:
              List Agents:
                value:
                  imageName: chromium
                  imageRepo: lscr.io/linuxserver/chromium
      responses:
        '200':
          description: ''
  /api/v1/sessions/create:
    post:
      tags:
        - SESSIONS
      summary: Create Session
      description: Create Session
      operationId: createSession
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                sessionId:
                  type: string
                  example: 3e01fe8d-b6e6-4aea-a33b-f8939f5091c2
            examples:
              Create Session:
                value:
                  sessionId: 3e01fe8d-b6e6-4aea-a33b-f8939f5091c2
      responses:
        '200':
          description: ''
  /api/v1/sessions/6b640059-e4d1-48b9-bd3c-2441ba754fae:
    get:
      tags:
        - SESSIONS
      summary: Get Session
      description: Get Session
      operationId: getSession
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                sessionId:
                  type: string
                  example: 6b640059-e4d1-48b9-bd3c-2441ba754fae
            examples:
              Get Session:
                value:
                  sessionId: 6b640059-e4d1-48b9-bd3c-2441ba754fae
      responses:
        '200':
          description: ''
  /api/v1/sessions/list:
    get:
      tags:
        - SESSIONS
      summary: List Sessions
      description: List Sessions
      operationId: listSessions
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                sessionId:
                  type: string
                  example: 6b640059-e4d1-48b9-bd3c-2441ba754fae
            examples:
              List Sessions:
                value:
                  sessionId: 6b640059-e4d1-48b9-bd3c-2441ba754fae
      responses:
        '200':
          description: ''
  /api/v1/sessions/setPermissions:
    put:
      tags:
        - SESSIONS
      summary: Set Permissions
      description: Set Permissions
      operationId: setPermissions
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                access:
                  type: string
                  example: read
                participantId:
                  type: string
                  example: a573a987-9f87-42ac-894a-49451e5e50bf
            examples:
              Set Permissions:
                value:
                  access: read
                  participantId: a573a987-9f87-42ac-894a-49451e5e50bf
      responses:
        '200':
          description: ''
  /api/v1/sessions/127aeb23-a626-4083-83b0-6023787ef096:
    delete:
      tags:
        - SESSIONS
      summary: Destroy Session
      description: Destroy Session
      operationId: destroySession
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                deletePersistence:
                  type: boolean
                  example: false
            examples:
              Destroy Session:
                value:
                  deletePersistence: false
      responses:
        '200':
          description: ''
  /api/v1/proxy/create:
    post:
      tags:
        - PROXY (Internal)
      summary: Create Proxy
      description: Create Proxy
      operationId: createProxy
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                agentId:
                  type: string
                  example: 1ed7c5aa-8b2b-4b92-b4fd-bc82ac39a92d
                clientId:
                  type: string
                  example: a877e9e1-5f80-4a6a-bb5f-15d07d48c261
                drawCursors:
                  type: boolean
                  example: true
                imageId:
                  type: string
                  example: db027ff3-3412-4ba9-90d5-1d91f3849c3f
                imageName:
                  type: string
                  example: chrome
                participantName:
                  type: string
                  example: John Doe
                participantsAccess:
                  type: string
                  example: read_write
                saveSession:
                  type: boolean
                  example: true
                sessionId:
                  type: string
                  example: f47ac10b-58cc-4372-a567-0e02b2c3d479
                sharedMemory:
                  type: number
                  example: 1024
                startUrl:
                  type: string
                  example: https://www.google.com
                status:
                  type: number
                  example: 1
                timezone:
                  type: string
                  example: Asia/Kolkata
            examples:
              Create Proxy:
                value:
                  agentId: 1ed7c5aa-8b2b-4b92-b4fd-bc82ac39a92d
                  clientId: a877e9e1-5f80-4a6a-bb5f-15d07d48c261
                  drawCursors: true
                  imageId: db027ff3-3412-4ba9-90d5-1d91f3849c3f
                  imageName: chrome
                  participantName: John Doe
                  participantsAccess: read_write
                  saveSession: true
                  sessionId: f47ac10b-58cc-4372-a567-0e02b2c3d479
                  sharedMemory: 1024
                  startUrl: https://www.google.com
                  status: 1
                  timezone: Asia/Kolkata
      responses:
        '200':
          description: ''
  /api/v1/proxy/{sessionId}/{participantId}:
    get:
      tags:
        - PROXY (Internal)
      summary: Get Proxy
      description: Get Proxy
      operationId: getProxy
      responses:
        '200':
          description: ''
    parameters:
      - name: sessionId
        in: path
        required: true
        schema:
          type: string
          example: ''
      - name: participantId
        in: path
        required: true
        schema:
          type: string
          example: ''
  /api/v1/proxy/{sessionId}:
    delete:
      tags:
        - PROXY (Internal)
      summary: Delete Proxy
      description: Delete Proxy
      operationId: deleteProxy
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                deletePersistence:
                  type: boolean
                  example: true
            examples:
              Delete Proxy:
                value:
                  deletePersistence: true
      responses:
        '200':
          description: ''
    parameters:
      - name: sessionId
        in: path
        required: true
        schema:
          type: string
          example: ''
tags:
  - name: AUTH
  - name: SESSIONS
  - name: IMAGES
  - name: AGENTS
  - name: PROXY (Internal)
