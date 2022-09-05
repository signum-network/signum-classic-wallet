package brs.services.impl;

import brs.IndirectIncoming;
import brs.Transaction;
import brs.db.store.IndirectIncomingStore;
import brs.props.PropertyService;
import brs.props.Props;
import brs.services.IndirectIncomingService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;


public class IndirectIncomingServiceImpl implements IndirectIncomingService {
    private static final Logger LOGGER = LoggerFactory.getLogger(IndirectIncomingServiceImpl.class);

    private final IndirectIncomingStore indirectIncomingStore;
    private final boolean disabled;

    public IndirectIncomingServiceImpl(IndirectIncomingStore indirectIncomingStore, PropertyService propertyService) {
        this.indirectIncomingStore = indirectIncomingStore;
        this.disabled = !propertyService.getBoolean(Props.INDIRECT_INCOMING_SERVICE_ENABLE);
        if (disabled) {
            LOGGER.warn("Indirect Incoming Service Disabled!");
        }
    }

    @Override
    public void processTransaction(Transaction transaction) {
        if (disabled) return;
        indirectIncomingStore.addIndirectIncomings(transaction.getType().getIndirectIncomings(transaction));
    }

    @Override
    public boolean isIndirectlyReceiving(Transaction transaction, long accountId) {
        // It would be confusing to have inconsistent behaviour so even when not loading from database we should disable when told to do so.
        if (disabled)
          return false;
        for(IndirectIncoming indirect : transaction.getType().getIndirectIncomings(transaction)) {
          if(indirect.getAccountId() == accountId)
            return true;
        }
        return false;
    }
}
