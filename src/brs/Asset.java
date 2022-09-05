package brs;

import brs.db.BurstKey;

public class Asset {

  private final long assetId;
  public final BurstKey dbKey;
  private final long accountId;
  private final String name;
  private final String description;
  private final long quantityQNT;
  private final byte decimals;
  private final boolean mintable;

  protected Asset(long assetId, BurstKey dbKey, long accountId, String name, String description, long quantityQNT, byte decimals, boolean mintable) {
    this.assetId = assetId;
    this.dbKey = dbKey;
    this.accountId = accountId;
    this.name = name;
    this.description = description;
    this.quantityQNT = quantityQNT;
    this.decimals = decimals;
    this.mintable = mintable;
  }

  public Asset(BurstKey dbKey, long assetId, long accountId, Attachment.ColoredCoinsAssetIssuance attachment) {
    this.dbKey = dbKey;
    this.assetId = assetId;
    this.accountId = accountId;
    this.name = attachment.getName();
    this.description = attachment.getDescription();
    this.quantityQNT = attachment.getQuantityQNT();
    this.decimals = attachment.getDecimals();
    this.mintable = attachment.getMintable();
  }

  public long getId() {
    return assetId;
  }

  public long getAccountId() {
    return accountId;
  }

  public String getName() {
    return name;
  }

  public String getDescription() {
    return description;
  }

  public long getQuantityQNT() {
    return quantityQNT;
  }

  public byte getDecimals() {
    return decimals;
  }
  
  public boolean getMintable() {
    return mintable;
  }

}
