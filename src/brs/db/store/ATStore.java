package brs.db.store;

import brs.at.AT;
import brs.db.BurstKey;
import brs.db.VersionedEntityTable;

import java.util.Collection;
import java.util.List;

public interface ATStore {

  boolean isATAccountId(Long id);

  List<Long> getOrderedATs();

  AT getAT(Long id);

  AT getAT(Long id, int height);

  List<Long> getATsIssuedBy(Long accountId, Long codeHashId, int from, int to);

  Collection<Long> getAllATIds(Long codeHashId);

  BurstKey.LongKeyFactory<AT> getAtDbKeyFactory();

  VersionedEntityTable<AT> getAtTable();

  BurstKey.LongKeyFactory<AT.ATState> getAtStateDbKeyFactory();

  VersionedEntityTable<AT.ATState> getAtStateTable();

  VersionedEntityTable<brs.at.AT.AtMapEntry> getAtMapTable();

  Long findTransaction(int startHeight, int endHeight, Long atID, int numOfTx, long minAmount);

  int findTransactionHeight(Long transactionId, int height, Long atID, long minAmount);

  long getMapValue(long atId, long key1, long key2);
}
