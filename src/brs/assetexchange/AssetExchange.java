package brs.assetexchange;

import brs.Account.AccountAsset;
import brs.*;
import brs.Attachment.ColoredCoinsAskOrderPlacement;
import brs.Attachment.ColoredCoinsAssetIssuance;
import brs.Attachment.ColoredCoinsAssetTransfer;
import brs.Attachment.ColoredCoinsBidOrderPlacement;
import brs.Order.Ask;
import brs.Order.Bid;
import brs.Trade.Event;
import brs.util.Listener;

import java.util.Collection;

public interface AssetExchange {

  Collection<Asset> getAllAssets(int from, int to);

  Asset getAsset(long assetId);

  int getTradeCount(long assetId);

  int getTransferCount(long id);

  int getAssetAccountsCount(Asset asset, long minimumQuantity, boolean ignoreTreasury, boolean unconfirmed);

  long getAssetCirculatingSupply(Asset asset, boolean ignoreTreasury, boolean unconfirmed);

  void addTradeListener(Listener<Trade> listener, Event trade);

  Ask getAskOrder(long orderId);

  void addAsset(long assetId, long accountId, ColoredCoinsAssetIssuance attachment);

  void addAssetTransfer(Transaction transaction, long assetId, long quantityQNT);

  void addAskOrder(Transaction transaction, ColoredCoinsAskOrderPlacement attachment);

  void addBidOrder(Transaction transaction, ColoredCoinsBidOrderPlacement attachment);

  void removeAskOrder(long orderId);

  Order.Bid getBidOrder(long orderId);

  void removeBidOrder(long orderId);

  Collection<Trade> getAllTrades(int i, int i1);

  Collection<Trade> getTrades(long assetId, int from, int to);

  Collection<Trade> getAccountTrades(long accountId, int from, int to);

  Collection<Trade> getAccountAssetTrades(long accountId, long assetId, int from, int to);

  Collection<AccountAsset> getAssetAccounts(Asset asset, boolean ignoreTreasury, long minimumQuantity, boolean unconfirmed, int from, int to);

  Collection<Asset> getAssetsIssuedBy(long accountId, int from, int to);

  Collection<AssetTransfer> getAssetTransfers(long assetId, int from, int to);

  Collection<AssetTransfer> getAccountAssetTransfers(long id, long id1, int from, int to);

  int getAssetsCount();

  int getAskCount();

  int getBidCount();

  int getTradesCount();

  int getAssetTransferCount();

  Collection<Ask> getAskOrdersByAccount(long accountId, int from, int to);

  Collection<Ask> getAskOrdersByAccountAsset(long accountId, long assetId, int from, int to);

  Collection<Bid> getBidOrdersByAccount(long accountId, int from, int to);

  Collection<Bid> getBidOrdersByAccountAsset(long accountId, long assetId, int from, int to);

  Collection<Ask> getAllAskOrders(int from, int to);

  Collection<Bid> getAllBidOrders(int from, int to);

  Collection<Ask> getSortedAskOrders(long assetId, int from, int to);

  Collection<Bid> getSortedBidOrders(long assetId, int from, int to);

}
