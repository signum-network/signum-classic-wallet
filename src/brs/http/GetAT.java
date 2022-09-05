package brs.http;

import brs.Attachment;
import brs.Blockchain;
import brs.BurstException;
import brs.Transaction;
import brs.at.AT;
import brs.at.AtApiHelper;
import brs.at.AtMachineState;
import brs.services.ParameterService;

import com.google.gson.JsonElement;

import javax.servlet.http.HttpServletRequest;

import static brs.http.common.Parameters.AT_PARAMETER;
import static brs.http.common.Parameters.INCLUDE_DETAILS_PARAMETER;

final class GetAT extends APIServlet.JsonRequestHandler {

  private final ParameterService parameterService;
  private final Blockchain blockchain;

  GetAT(ParameterService parameterService, Blockchain blockchain) {
    super(new APITag[]{APITag.AT}, AT_PARAMETER, INCLUDE_DETAILS_PARAMETER);
    this.parameterService = parameterService;
    this.blockchain = blockchain;
  }

  @Override
  protected
  JsonElement processRequest(HttpServletRequest req) throws BurstException {
    boolean includeDetails = !("false".equalsIgnoreCase(req.getParameter(INCLUDE_DETAILS_PARAMETER)));
    
    AT at = parameterService.getAT(req);
    AtMachineState atCreation = null;

    if(includeDetails) {
      Transaction transaction = blockchain.getTransaction(AtApiHelper.getLong(at.getId()));
      if(transaction.getAttachment()!=null && transaction.getAttachment() instanceof Attachment.AutomatedTransactionsCreation) {
        Attachment.AutomatedTransactionsCreation atCreationAttachment = (Attachment.AutomatedTransactionsCreation)transaction.getAttachment();
        
        atCreation = new AtMachineState(at.getId(), at.getCreator(), atCreationAttachment.getCreationBytes(), at.getCreationBlockHeight());
      }
    }
    
    return JSONData.at(at, atCreation, includeDetails);
  }

}
