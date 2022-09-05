package brs.http;

import brs.*;
import brs.at.AtConstants;
import brs.at.AtMachineState;
import brs.services.ParameterService;
import brs.util.Convert;
import brs.util.TextUtils;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.servlet.http.HttpServletRequest;
import java.nio.ByteBuffer;
import java.nio.ByteOrder;

import static brs.http.JSONResponses.*;
import static brs.http.common.Parameters.*;
import static brs.http.common.ResultFields.ERROR_CODE_RESPONSE;
import static brs.http.common.ResultFields.ERROR_DESCRIPTION_RESPONSE;

final class CreateATProgram extends CreateTransaction {

  private final Logger logger = LoggerFactory.getLogger(CreateATProgram.class);

  private final ParameterService parameterService;
  private final Blockchain blockchain;

  CreateATProgram(ParameterService parameterService, Blockchain blockchain, APITransactionManager apiTransactionManager) {
    super(new APITag[]{APITag.AT, APITag.CREATE_TRANSACTION}, apiTransactionManager,
        NAME_PARAMETER, DESCRIPTION_PARAMETER, CREATION_BYTES_PARAMETER, CODE_PARAMETER, DATA_PARAMETER, DPAGES_PARAMETER, CSPAGES_PARAMETER, USPAGES_PARAMETER, MIN_ACTIVATION_AMOUNT_NQT_PARAMETER);
    this.parameterService = parameterService;
    this.blockchain = blockchain;
  }

  @Override
  protected
  JsonElement processRequest(HttpServletRequest req) throws BurstException {
    String name = req.getParameter(NAME_PARAMETER);
    String description = req.getParameter(DESCRIPTION_PARAMETER);

    if (name == null) {
      return MISSING_NAME;
    }

    name = name.trim();
    if (name.length() > Constants.MAX_AUTOMATED_TRANSACTION_NAME_LENGTH) {
      return INCORRECT_AUTOMATED_TRANSACTION_NAME_LENGTH;
    }

    if (!TextUtils.isInAlphabet(name)) {
      return INCORRECT_AUTOMATED_TRANSACTION_NAME;
    }

    if (description != null && description.length() > Constants.MAX_AUTOMATED_TRANSACTION_DESCRIPTION_LENGTH) {
      return INCORRECT_AUTOMATED_TRANSACTION_DESCRIPTION;
    }

    byte[] creationBytes = ParameterParser.getCreationBytes(req);
    if(creationBytes == null) {
      try {
        String code = req.getParameter(CODE_PARAMETER);
        if (code!=null && (code.length() & 1) != 0) {
          throw new IllegalArgumentException();
        }

        short version = AtConstants.getInstance().atVersion(blockchain.getHeight());
        int cpages = 0;
        int dpages = 0;
        int cspages = 0;
        int uspages = 0;
        long minActivationAmount = 0L;

        if (code == null) {
          // reuse code from another AT, code comes from the reference transaction
          String referenceTransaction = req.getParameter(REFERENCED_TRANSACTION_FULL_HASH_PARAMETER);
          Transaction transaction = blockchain.getTransactionByFullHash(referenceTransaction);
          if(transaction == null || !(transaction.getAttachment() instanceof Attachment.AutomatedTransactionsCreation)) {
            throw new IllegalArgumentException();
          }
          Attachment.AutomatedTransactionsCreation atCreationAttachment = (Attachment.AutomatedTransactionsCreation)transaction.getAttachment();
          AtMachineState atCreation = new AtMachineState(null, null, atCreationAttachment.getCreationBytes(), transaction.getHeight());
          if(atCreation.getApCodeBytes().length == 0) {
            throw new IllegalArgumentException();
          }
          // we reuse all the configuration, so they behave identically
          version = atCreation.getVersion();
          dpages = atCreation.getDataPages();
          cspages = atCreation.getCallStackPages();
          uspages = atCreation.getUserStackPages();
          minActivationAmount = atCreation.minActivationAmount();
          code = "";
        }
        else {
          // new contract code
          cpages = (code.length() / 2 / 256) + (((code.length() / 2) % 256) != 0 ? 1 : 0);
          dpages = Integer.parseInt(req.getParameter(DPAGES_PARAMETER));
          cspages = Integer.parseInt(req.getParameter(CSPAGES_PARAMETER));
          uspages = Integer.parseInt(req.getParameter(USPAGES_PARAMETER));
          minActivationAmount = Convert.parseUnsignedLong(req.getParameter(MIN_ACTIVATION_AMOUNT_NQT_PARAMETER));
        }

        String data = req.getParameter(DATA_PARAMETER);
        if (data == null) {
          data = "";
        }
        if ((data.length() & 1) != 0) {
          throw new IllegalArgumentException();
        }

        if (dpages < 0 || cspages < 0 || uspages < 0) {
          throw new IllegalArgumentException();
        }

        int creationLength = 4; // version + reserved
        creationLength += 8; // pages
        creationLength += 8; // minActivationAmount
        creationLength += cpages * 256 <= 256 ? 1 : (cpages * 256 <= 32767 ? 2 : 4); // code size
        creationLength += code.length() / 2;
        creationLength += dpages * 256 <= 256 ? 1 : (dpages * 256 <= 32767 ? 2 : 4); // data size
        creationLength += data.length() / 2;

        ByteBuffer creation = ByteBuffer.allocate(creationLength);
        creation.order(ByteOrder.LITTLE_ENDIAN);
        creation.putShort(version);
        creation.putShort((short) 0);
        creation.putShort((short) cpages);
        creation.putShort((short) dpages);
        creation.putShort((short) cspages);
        creation.putShort((short) uspages);
        creation.putLong(minActivationAmount);
        putLength(cpages, code, creation);
        byte[] codeBytes = Convert.parseHexString(code);
        if (codeBytes != null) {
          creation.put(codeBytes);
        }
        putLength(dpages, data, creation);
        byte[] dataBytes = Convert.parseHexString(data);
        if (dataBytes != null) {
          creation.put(dataBytes);
        }

        creationBytes = creation.array();
      } catch (Exception e) {
        JsonObject response = new JsonObject();
        response.addProperty(ERROR_CODE_RESPONSE, 5);
        response.addProperty(ERROR_DESCRIPTION_RESPONSE, "Invalid or not specified parameters");
        return response;
      }
    }

    Account account = parameterService.getSenderAccount(req);
    Attachment attachment = new Attachment.AutomatedTransactionsCreation(name, description, creationBytes, blockchain.getHeight());

    logger.debug("AT {} attachment created successfully", name);
    return createTransaction(req, account, attachment);
  }

    private void putLength(int nPages, String string, ByteBuffer buffer) {
        if (nPages == 0) {
          buffer.put((byte) 0);
        }
        else if (nPages * 256 <= 256) {
            buffer.put((byte) (string.length() / 2));
        } else if (nPages * 256 <= 32767) {
            buffer.putShort((short) (string.length() / 2));
        } else {
            buffer.putInt(string.length() / 2);
        }
    }
}
