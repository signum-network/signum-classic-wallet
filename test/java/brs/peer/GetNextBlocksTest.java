package brs.peer;

import brs.Block;
import brs.Blockchain;
import brs.Genesis;
import brs.props.PropertyService;
import brs.props.Props;

import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.junit.runners.JUnit4;
import org.mockito.ArgumentMatchers;

import java.util.ArrayList;
import java.util.List;

import static org.junit.Assert.*;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

@RunWith(JUnit4.class)
public class GetNextBlocksTest {
    private GetNextBlocks getNextBlocks;
    private Blockchain mockBlockchain;
    private PropertyService mockPropertyService;
    private Peer mockPeer;

    @Before
    public void setUpGetNextBlocksTest() {
        mockBlockchain = mock(Blockchain.class);
        mockPropertyService = mock(PropertyService.class);
        mockPeer = mock(Peer.class);
        Block mockBlock = mock(Block.class);
        when(mockBlock.getJsonObject()).thenReturn(new JsonObject());
        when(mockPropertyService.getInt(Props.P2P_MAX_BLOCKS)).thenReturn(720);
        List<Block> blocks = new ArrayList<>();
        for (int i = 0; i < 100; i++) {
            blocks.add(mockBlock);
        }
        when(mockBlockchain.getBlocksAfter(ArgumentMatchers.eq(Genesis.GENESIS_BLOCK_ID), ArgumentMatchers.anyInt())).thenReturn(blocks);
        getNextBlocks = new GetNextBlocks(mockBlockchain, mockPropertyService);
    }

    @Test
    public void testGetNextBlocks() {
        JsonObject request = new JsonObject();
        request.addProperty("blockId", Long.toUnsignedString(Genesis.GENESIS_BLOCK_ID));
        JsonElement responseElement = getNextBlocks.processRequest(request, mockPeer);
        assertNotNull(responseElement);
        assertTrue(responseElement.isJsonObject());
        JsonObject response = responseElement.getAsJsonObject();
        assertTrue(response.has("nextBlocks"));
        JsonElement nextBlocksElement = response.get("nextBlocks");
        assertNotNull(nextBlocksElement);
        assertTrue(nextBlocksElement.isJsonArray());
        JsonArray nextBlocks = nextBlocksElement.getAsJsonArray();
        assertEquals(100, nextBlocks.size());
        for (JsonElement nextBlock : nextBlocks) {
            assertNotNull(nextBlock);
            assertTrue(nextBlock.isJsonObject());
        }
    }

    @Test
    public void testGetNextBlocks_noIdSpecified() {
        JsonObject request = new JsonObject();
        JsonElement responseElement = getNextBlocks.processRequest(request, mockPeer);
        assertNotNull(responseElement);
        assertTrue(responseElement instanceof JsonObject);
        JsonObject response = responseElement.getAsJsonObject();
        assertTrue(response.has("nextBlocks"));
        JsonElement nextBlocksElement = response.get("nextBlocks");
        assertNotNull(nextBlocksElement);
        assertTrue(nextBlocksElement instanceof JsonArray);
        JsonArray nextBlocks = nextBlocksElement.getAsJsonArray();
        assertEquals(0, nextBlocks.size());
    }
}
