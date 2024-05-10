
import { Response } from "express";
import { ERROR_MESSAGES, HTTP_STATUS_CODES, loggerUtils } from "workspaces-micro-commons";;
import { AGENT_ERROR_RESPONSES } from "../../constants";
import { AgentDetails, IAgent } from "../../types/custom";
import { Request } from "../../types/express";
import { Agent } from "../../models/agentsModel";
import { validateAgents, validateUpdateAgents } from "../../validations/agentsValidation";
import { agentsService } from "../services";
 
export const agentsController = {
  createAgent: async (req: Request, res: Response): Promise<Response> => {
    try {
      const agentDetails: AgentDetails = new Agent(req.body);
      agentDetails.clientId = req.decodedToken.clientId;
      
      const { error } = validateAgents(agentDetails);

      if (error) {
        if (error.details)
          return res.status(HTTP_STATUS_CODES.BAD_REQUEST).send({
            errorCode: AGENT_ERROR_RESPONSES.AGENTERR001,
            errorMessage: error.details[0].message,
          });
        else
          return res.status(HTTP_STATUS_CODES.BAD_REQUEST).send({
            errorCode: AGENT_ERROR_RESPONSES.AGENTERR001,
            errorMessage: error.message,
          });
      }

      const agentExists: boolean = await agentsService.agentExistsByHostAndPort(agentDetails.agentHost, agentDetails.agentPort);

      if (agentExists) {
        return res
          .status(HTTP_STATUS_CODES.BAD_REQUEST)
          .send(AGENT_ERROR_RESPONSES.AGENTERR004);
      }

      await agentsService.createAgent(agentDetails);

      return res.status(HTTP_STATUS_CODES.OK).send({
        data: { agentId: agentDetails.agentId },
        message: "Agent Created Successfully",
      });
    } catch (error) {
      loggerUtils.error(`agentsController :: create :: ${error}`);
      return res
        .status(HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR)
        .send(AGENT_ERROR_RESPONSES.AGENTERR000);
    }
  },
  getAgentById: async (req: Request, res: Response): Promise<Response> => {
    try {
      const agentId: string = req.params.agentId;

      if (!agentId) return res
      .status(HTTP_STATUS_CODES.BAD_REQUEST)
      .send(AGENT_ERROR_RESPONSES.AGENTERR002);
  
      const agents: IAgent[] = await agentsService.getAgentById(agentId)

      if (agents.length == 0) return res
      .status(HTTP_STATUS_CODES.BAD_REQUEST)
      .send(AGENT_ERROR_RESPONSES.AGENTERR003);
  
      return res.status(HTTP_STATUS_CODES.OK).send({
        data: { agent: agents[0] },
        message: `Agent Fetched Successfully`,
      });
    } catch (error) {
      loggerUtils.error(`agentsController :: getAgentById :: ${error}`);
      return res
        .status(HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR)
        .send(AGENT_ERROR_RESPONSES.AGENTERR000);
    }
  },
  deleteAgentById: async (
    req: Request,
    res: Response
  ): Promise<Response> => {
    try {
      const agentId: string = req.params.agentId;

      if (!agentId) return res
      .status(HTTP_STATUS_CODES.BAD_REQUEST)
      .send(AGENT_ERROR_RESPONSES.AGENTERR002);

      const agentExists: boolean = await agentsService.agentExistsById(agentId)

      if (!agentExists) return res
      .status(HTTP_STATUS_CODES.BAD_REQUEST)
      .send(AGENT_ERROR_RESPONSES.AGENTERR003);
  
      await agentsService.deleteAgentById(agentId);
  
      return res.status(HTTP_STATUS_CODES.OK).send({
        data: { agentId },
        message: "Agent Deleted Successfully",
      });
    } catch (error) {
      loggerUtils.error(`agentsController :: deleteAgentById :: ${error}`);
      return res.status(HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR).send({
        data: null,
        message: ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
      });
    }
  },
  updateAgentById: async (
    req: Request,
    res: Response
  ): Promise<Response> => {
    try {
      const agentDetails: AgentDetails = req.body;
      agentDetails.agentId = req.params.agentId;
      agentDetails.clientId = req.decodedToken.clientId;

      const { error } = validateUpdateAgents(agentDetails);
  
      if (error) {
        if (error.details)
          return res.status(HTTP_STATUS_CODES.BAD_REQUEST).send({
            errorCode: AGENT_ERROR_RESPONSES.AGENTERR001.errorCode,
            errorMessage: error.details[0].message,
          });
        else
          return res.status(HTTP_STATUS_CODES.BAD_REQUEST).send({
            errorCode: AGENT_ERROR_RESPONSES.AGENTERR001.errorCode,
            errorMessage: error.message,
          });
      }

      const agentExists: boolean = await agentsService.agentExistsById(agentDetails.agentId)

      if (!agentExists) return res
      .status(HTTP_STATUS_CODES.BAD_REQUEST)
      .send(AGENT_ERROR_RESPONSES.AGENTERR003);
  
      await agentsService.updateAgentById(agentDetails);
  
      return res.status(HTTP_STATUS_CODES.OK).send({
        data: { agentId: agentDetails.agentId },
        message: "Agent Updated Successfully",
      });
    } catch (error) {
      loggerUtils.error(`agentsController :: updateAgentById :: ${error}`);
      return res.status(HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR).send({
        data: null,
        message: ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
      });
    }
  },
  listAgentsByClientId: async (
    req: Request,
    res: Response
  ): Promise<Response> => {
    try {
      const clientId = req.decodedToken.clientId;

      const agents: IAgent[] = await agentsService.listAgentsByClientId(clientId)

      if (agents.length == 0) return res
      .status(HTTP_STATUS_CODES.OK)
      .send({
        data: { agents },
        message: "No Agents found!",
      });
    
      return res.status(HTTP_STATUS_CODES.OK).send({
        data: { agents },
        message: "Agent List Successfully",
      });
    } catch (error) {
      loggerUtils.error(`agentsController :: listAgentsByClientId :: ${error}`);
      return res.status(HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR).send({
        data: null,
        message: ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
      });
    }
  },
}
