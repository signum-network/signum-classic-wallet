package brs.http;

import brs.Burst;
import brs.util.Convert;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;

import javax.servlet.http.HttpServletRequest;

import static brs.http.common.ResultFields.VALUE_RESPONSE;
import static brs.http.common.Parameters.AT_PARAMETER;
import static brs.http.common.Parameters.KEY1_PARAMETER;
import static brs.http.common.Parameters.KEY2_PARAMETER;


final class GetATMapValue extends APIServlet.JsonRequestHandler {


  GetATMapValue() {
    super(new APITag[] {APITag.AT}, AT_PARAMETER, KEY1_PARAMETER, KEY2_PARAMETER);
  }

  @Override
  protected
  JsonElement processRequest(HttpServletRequest req) {

    long atId = Convert.parseUnsignedLong(req.getParameter(AT_PARAMETER));
    long key1 = Convert.parseUnsignedLong(req.getParameter(KEY1_PARAMETER));
    long key2 = Convert.parseUnsignedLong(req.getParameter(KEY2_PARAMETER));

    String value = Convert.toUnsignedLong(Burst.getStores().getAtStore().getMapValue(atId, key1, key2));

    JsonObject response = new JsonObject();
    response.addProperty(VALUE_RESPONSE, value);
    return response;
  }

}
