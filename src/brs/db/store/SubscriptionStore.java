package brs.db.store;

import brs.Subscription;
import brs.db.BurstKey;
import brs.db.VersionedEntityTable;

import java.util.Collection;

public interface SubscriptionStore {

  BurstKey.LongKeyFactory<Subscription> getSubscriptionDbKeyFactory();

  VersionedEntityTable<Subscription> getSubscriptionTable();

  void saveSubscriptions(Collection<Subscription> subscriptions);

  Collection<Subscription> getSubscriptionsByParticipant(Long accountId);

  Collection<Subscription> getIdSubscriptions(Long accountId);

  Collection<Subscription> getSubscriptionsToId(Long accountId);

  Collection<Subscription> getUpdateSubscriptions(int timestamp);
}
