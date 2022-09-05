package brs.services;

import brs.at.AT;

import java.util.Collection;
import java.util.List;

public interface ATService {

  Collection<Long> getAllATIds(Long codeHashId);

  List<Long> getATsIssuedBy(Long accountId, Long codeHashId, int from, int to);

  AT getAT(Long atId);

  AT getAT(Long atId, int height);
}
