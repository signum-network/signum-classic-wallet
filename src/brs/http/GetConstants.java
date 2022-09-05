package brs.http;

import brs.Burst;
import brs.Constants;
import brs.Genesis;
import brs.TransactionType;
import brs.TransactionType.Fee;
import brs.fluxcapacitor.FluxValues;
import brs.props.Props;
import brs.util.Convert;
import brs.util.JSON;
import burst.kit.util.BurstKitUtils;

import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;

import javax.servlet.http.HttpServletRequest;

final class GetConstants extends APIServlet.JsonRequestHandler {

    static final GetConstants instance = new GetConstants();

    private GetConstants() {
        super(new APITag[] {APITag.INFO});
    }

    @Override
    protected
    JsonElement processRequest(HttpServletRequest req) {
        JsonObject response = new JsonObject();
        response.addProperty("networkName", Burst.getPropertyService().getString(Props.NETWORK_NAME));
        response.addProperty("genesisBlockId", Burst.getPropertyService().getString(Props.GENESIS_BLOCK_ID));
        response.addProperty("genesisAccountId", Convert.toUnsignedLong(Genesis.CREATOR_ID));
        response.addProperty("maxBlockPayloadLength", (Burst.getFluxCapacitor().getValue(FluxValues.MAX_PAYLOAD_LENGTH)));
        response.addProperty("maxArbitraryMessageLength", Constants.MAX_ARBITRARY_MESSAGE_LENGTH);
        response.addProperty("ordinaryTransactionLength", Constants.ORDINARY_TRANSACTION_BYTES);
        response.addProperty("addressPrefix", BurstKitUtils.getAddressPrefix());
        response.addProperty("valueSuffix", BurstKitUtils.getValueSuffix());
        response.addProperty("blockTime", Burst.getFluxCapacitor().getValue(FluxValues.BLOCK_TIME));
        response.addProperty("decimalPlaces", Burst.getPropertyService().getInt(Props.DECIMAL_PLACES));
        response.addProperty("feeQuantNQT", Burst.getFluxCapacitor().getValue(FluxValues.FEE_QUANT));
        response.addProperty("cashBackId", Burst.getPropertyService().getString(Props.CASH_BACK_ID));
        response.addProperty("cashBackFactor", Burst.getPropertyService().getInt(Props.CASH_BACK_FACTOR));

        JsonArray transactionTypes = new JsonArray();
        TransactionType.getTransactionTypes()
                .forEach((key, value) -> {
                    JsonObject transactionType = new JsonObject();
                    transactionType.addProperty("value", key.getType());
                    transactionType.addProperty("description", key.getDescription());
                    JsonArray transactionSubtypes = new JsonArray();
                    transactionSubtypes.addAll(value.entrySet().stream()
                            .map(entry -> {
                                JsonObject transactionSubtype = new JsonObject();
                                Fee fee = entry.getValue().getBaselineFee(Burst.getBlockchain().getHeight());
                                transactionSubtype.addProperty("value", entry.getKey());
                                transactionSubtype.addProperty("description", entry.getValue().getDescription());
                                transactionSubtype.addProperty("minimumFeeConstantNQT", fee.getConstantFee());
                                transactionSubtype.addProperty("minimumFeeAppendagesNQT", fee.getAppendagesFee());
                                return transactionSubtype;
                            })
                            .collect(JSON.jsonArrayCollector()));
                    transactionType.add("subtypes", transactionSubtypes);
                    transactionTypes.add(transactionType);
                });
        response.add("transactionTypes", transactionTypes);

        JsonArray peerStates = new JsonArray();
        JsonObject peerState = new JsonObject();
        peerState.addProperty("value", 0);
        peerState.addProperty("description", "Non-connected");
        peerStates.add(peerState);
        peerState = new JsonObject();
        peerState.addProperty("value", 1);
        peerState.addProperty("description", "Connected");
        peerStates.add(peerState);
        peerState = new JsonObject();
        peerState.addProperty("value", 2);
        peerState.addProperty("description", "Disconnected");
        peerStates.add(peerState);
        response.add("peerStates", peerStates);

        return response;
    }
}
