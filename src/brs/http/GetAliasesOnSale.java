package brs.http;

import brs.Alias;
import brs.BurstException;
import brs.services.AliasService;
import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;

import javax.servlet.http.HttpServletRequest;

import static brs.http.common.Parameters.*;
import static brs.http.common.ResultFields.ALIASES_RESPONSE;

import java.util.Collection;

public final class GetAliasesOnSale extends APIServlet.JsonRequestHandler {

  private final AliasService aliasService;

  GetAliasesOnSale(AliasService aliasService) {
    super(new APITag[]{APITag.ALIASES}, FIRST_INDEX_PARAMETER, LAST_INDEX_PARAMETER);
    this.aliasService = aliasService;
  }

  @Override
  protected
  JsonElement processRequest(HttpServletRequest req) throws BurstException {
    int firstIndex = ParameterParser.getFirstIndex(req);
    int lastIndex = ParameterParser.getLastIndex(req);

    JsonArray aliasesJson = new JsonArray();
    Collection<Alias.Offer> aliasOffers = aliasService.getAliasOffers(firstIndex, lastIndex);
    for(Alias.Offer offer : aliasOffers) {
      Alias alias = aliasService.getAlias(offer.getId());
      aliasesJson.add(JSONData.alias(alias, offer));
    }

    JsonObject response = new JsonObject();
    response.add(ALIASES_RESPONSE, aliasesJson);
    return response;
  }

}
