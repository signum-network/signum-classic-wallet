package brs.db.store;

import java.util.Collection;

import brs.IndirectIncoming;

public interface IndirectIncomingStore {
    void addIndirectIncomings(Collection<IndirectIncoming> indirectIncomings);
    
    Collection<Long> getIndirectIncomings(long accountId, int from, int to);
    
    public IndirectIncoming getIndirectIncoming(long accountId, long transactionId);
}
