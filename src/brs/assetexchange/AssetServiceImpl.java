package brs.assetexchange;

import brs.Account.AccountAsset;
import brs.*;
import brs.db.BurstKey;
import brs.db.sql.EntitySqlTable;
import brs.db.store.AssetStore;

import java.util.Collection;

class AssetServiceImpl {

  private final AssetStore assetStore;
  private final AssetAccountServiceImpl assetAccountService;
  private final TradeServiceImpl tradeService;
  private final AssetTransferServiceImpl assetTransferService;

  private final EntitySqlTable<Asset> assetTable;

  private final BurstKey.LongKeyFactory<Asset> assetDbKeyFactory;

  public AssetServiceImpl(AssetAccountServiceImpl assetAccountService, TradeServiceImpl tradeService, AssetStore assetStore, AssetTransferServiceImpl assetTransferService) {
    this.assetAccountService = assetAccountService;
    this.tradeService = tradeService;
    this.assetStore = assetStore;
    this.assetTable = assetStore.getAssetTable();
    this.assetDbKeyFactory = assetStore.getAssetDbKeyFactory();
    this.assetTransferService = assetTransferService;
  }

  public Asset getAsset(long id) {
    return assetTable.get(assetDbKeyFactory.newKey(id));
  }

  public Collection<AccountAsset> getAccounts(Asset asset, boolean filterIgnored, long minimumQuantity, boolean unconfirmed, int from, int to) {
    return assetAccountService.getAssetAccounts(asset, filterIgnored, minimumQuantity, unconfirmed, from, to);
  }

  public Collection<Trade> getTrades(long assetId, int from, int to) {
    return tradeService.getAssetTrades(assetId, from, to);
  }

  public Collection<AssetTransfer> getAssetTransfers(long assetId, int from, int to) {
    return assetTransferService.getAssetTransfers(assetId, from, to);
  }

  public Collection<Asset> getAllAssets(int from, int to) {
    return assetTable.getAll(from, to);
  }

  public Collection<Asset> getAssetsIssuedBy(long accountId, int from, int to) {
    return assetStore.getAssetsIssuedBy(accountId, from, to);
  }

  public int getAssetsCount() {
    return assetTable.getCount();
  }

  public void addAsset(long assetId, long senderId, Attachment.ColoredCoinsAssetIssuance attachment) {
    final BurstKey dbKey = assetDbKeyFactory.newKey(assetId);
    assetTable.insert(new Asset(dbKey, assetId, senderId, attachment));
  }

}
