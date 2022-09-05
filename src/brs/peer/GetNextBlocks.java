package brs.peer;

import brs.Block;
import brs.Blockchain;
import brs.Constants;
import brs.props.PropertyService;
import brs.props.Props;
import brs.util.Convert;
import brs.util.JSON;
import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

final class GetNextBlocks implements PeerServlet.PeerRequestHandler {
  
  private static final Logger logger = LoggerFactory.getLogger(GetNextBlocks.class);

  private final Blockchain blockchain;
  private static final int MAX_LENGHT = 1048576;
  private static final int MAX_BLOCKS = 1440 / 2; // maxRollback must be at least 1440 and we are using half of that
  private final int maxBlocks;

  GetNextBlocks(Blockchain blockchain, PropertyService propertyService) {
    this.blockchain = blockchain;
    
    maxBlocks = Math.min(MAX_BLOCKS, propertyService.getInt(Props.P2P_MAX_BLOCKS));
    logger.info("P2P max number of blocks: {}", maxBlocks);
  }


  @Override
  public JsonElement processRequest(JsonObject request, Peer peer) {

    JsonObject response = new JsonObject();

    List<Block> nextBlocks = new ArrayList<>();
    int totalLength = 0;
    long blockId = Convert.parseUnsignedLong(JSON.getAsString(request.get("blockId")));
    
    while(totalLength < MAX_LENGHT && nextBlocks.size() < maxBlocks) {
      Collection<? extends Block> blocks = blockchain.getBlocksAfter(blockId, Math.min(100, maxBlocks));
      if (blocks.isEmpty()) {
    	break;
      }
      
      for (Block block : blocks) {
        int length = Constants.BLOCK_HEADER_LENGTH + block.getPayloadLength();
        totalLength += length;
        nextBlocks.add(block);
        if (totalLength >= MAX_LENGHT || nextBlocks.size() >= MAX_BLOCKS) {
          break;
        }
        blockId = block.getId();
      }      
    }

    JsonArray nextBlocksArray = new JsonArray();
    for (Block nextBlock : nextBlocks) {
      nextBlocksArray.add(nextBlock.getJsonObject());
    }
    response.add("nextBlocks", nextBlocksArray);

    return response;
  }

}
