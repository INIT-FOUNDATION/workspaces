import {
    Kafka,
    logLevel,
    Producer,
    Consumer,
    EachMessagePayload,
  } from "kafkajs";
  import {
    getBooleanEnvVariableOrDefault,
    getStringEnvVariableOrDefault,
  } from "../config/envUtils";
  import { loggerUtils } from "../monitoring/loggerUtils";
  import fs from "fs";
  
  interface KafkaConfig {
    brokers: string[];
    clientId: string;
    logLevel: logLevel;
    ssl?: {
      rejectUnauthorized: boolean;
      ca: Buffer[];
      key: Buffer;
      cert: Buffer;
    };
  }
  
  const brokers = getStringEnvVariableOrDefault(
    "WORKSPACES_KAFKA_BROKERS",
    "localhost:9092"
  );
  
  const kafkaConfig: KafkaConfig = {
    brokers: brokers.split(","),
    clientId: getStringEnvVariableOrDefault(
      "WORKSPACES_KAFKA_CLIENT_ID",
      "CommonUtilityService"
    ),
    logLevel: logLevel.ERROR,
  };
  
  const enableSSL = getBooleanEnvVariableOrDefault(
    "WORKSPACES_KAFKA_ENABLE_SSL",
    false
  );
  
  if (enableSSL) {
    kafkaConfig.ssl = {
      rejectUnauthorized: getBooleanEnvVariableOrDefault(
        "WORKSPACES_KAFKA_REJECT_UNAUTHORIZED",
        true
      ),
      ca: [
        fs.readFileSync(
          getStringEnvVariableOrDefault("WORKSPACES_KAFKA_CA_PATH", "")
        ),
      ],
      key: fs.readFileSync(
        getStringEnvVariableOrDefault("WORKSPACES_KAFKA_KEY_PATH", "")
      ),
      cert: fs.readFileSync(
        getStringEnvVariableOrDefault("WORKSPACES_KAFKA_CERT_PATH", "")
      ),
    };
  }
  
  const kafka = new Kafka(kafkaConfig);
  
  const enableProducer = getBooleanEnvVariableOrDefault(
    "WORKSPACES_KAFKA_ENABLE_PRODUCER",
    false
  );
  
  const enableConsumer = getBooleanEnvVariableOrDefault(
    "WORKSPACES_KAFKA_ENABLE_CONSUMER",
    false
  );
  
  let producer: Producer | undefined;
  let consumer: Consumer | undefined;
  
  if (enableProducer) {
    producer = kafka.producer();
  
    producer
      .connect()
      .then(async () => {
        loggerUtils.info("kafkaUtils :: Producer :: Connected");
  
        const predefinedTopics = getStringEnvVariableOrDefault(
          "WORKSPACES_KAFKA_PREDEFINED_TOPICS",
          ""
        );
  
        if (predefinedTopics) {
          loggerUtils.debug(
            `kafkaUtils :: Producer :: Predefined topics configured ${predefinedTopics}, Creating Predefined Topics`
          );
  
          const topicsList = predefinedTopics
            .split(",")
            .map((topic) => ({ topic }));
  
          await createTopicIfNotExists(topicsList);
        }
      })
      .catch((error) => {
        loggerUtils.error(
          `kafkaUtils :: Producer :: Error connecting Kafka producer :: ${error}`
        );
      });
  }
  
  if (enableConsumer) {
    consumer = kafka.consumer({
      groupId: getStringEnvVariableOrDefault(
        "WORKSPACES_KAFKA_CONSUMER_GROUP_ID",
        "CommonUtilityService"
      ),
    });
  
    consumer
      .connect()
      .then(() => {
        loggerUtils.info("kafkaUtils :: Consumer :: Connected");
      })
      .catch((error) => {
        loggerUtils.error(
          `kafkaUtils :: Consumer :: Error connecting Kafka consumer :: ${error}`
        );
      });
  }
  
  async function pause(topic: string, partitions: number[]): Promise<void> {
    if (consumer) {
      await consumer.pause([{ topic, partitions }]);
    }
  }
  
  async function resume(topic: string, partitions: number[]): Promise<void> {
    if (consumer) {
      await consumer.resume([{ topic, partitions }]);
    }
  }
  
  async function produce(
    topic: string,
    message: string,
    partition: number = 0
  ): Promise<void> {
    if (producer) {
      await producer.send({
        topic,
        messages: [{ value: message }],
        ...(partition && { partition }),
      });
    }
  }
  
  async function subscribe(
    topic: string,
    fromBeginning: boolean = false,
    partitions: Array<number> = []
  ): Promise<void> {
    if (consumer) {
      const consumerConfig = {
        topic,
        fromBeginning,
        partitions: partitions.length > 0 ? partitions : undefined,
      };
  
      await consumer.subscribe(consumerConfig);
    }
  }
  
  async function consume(
    callback: (payload: EachMessagePayload) => void,
    partitions: number[] = []
  ): Promise<void> {
    if (consumer) {
      await consumer.run({
        eachMessage: async ({
          topic,
          partition: msgPartition,
          message,
          heartbeat,
          pause,
        }) => {
          if (partitions.length === 0 || partitions.includes(msgPartition || 0)) {
            callback({
              message: message,
              topic,
              partition: msgPartition || 0,
              heartbeat: heartbeat,
              pause: pause,
            });
          }
        },
      });
    }
  }
  
  async function createTopicIfNotExists(
    topicsList: Array<{ topic: string }>
  ): Promise<void> {
    try {
      const admin = kafka.admin();
      await admin.connect();
  
      const topicExists = await admin.listTopics();
      const promises = topicsList.map(async ({ topic }) => {
        if (!topicExists.includes(topic)) {
          await admin.createTopics({
            topics: [{ topic }],
          });
          loggerUtils.debug(
            `kafkaUtils :: Producer :: Topic ${topic} created successfully`
          );
        } else {
          loggerUtils.debug(
            `kafkaUtils :: Producer :: Topic ${topic} already exists`
          );
        }
      });
  
      await Promise.all(promises);
    } catch (error) {
      loggerUtils.error(
        `kafkaUtils :: Producer :: Error creating topic :: ${error}`
      );
    } finally {
      await kafka.admin().disconnect();
    }
  }
  
  export { subscribe, pause, resume, produce, consume };