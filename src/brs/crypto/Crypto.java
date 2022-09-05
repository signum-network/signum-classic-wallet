package brs.crypto;

import burst.kit.crypto.BurstCrypto;
import burst.kit.entity.BurstID;
import org.bouncycastle.jcajce.provider.digest.MD5;

import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;

public final class Crypto {
  static final BurstCrypto burstCrypto = BurstCrypto.getInstance();

  private Crypto() {
  } //never

  public static MessageDigest sha256() {
    return burstCrypto.getSha256();
  }

  public static MessageDigest shabal256() {
    return burstCrypto.getShabal256();
  }

  public static MessageDigest ripemd160() {
    return burstCrypto.getRipeMD160();
  }

  public static MessageDigest md5() {// TODO unit test
    try {
      return MessageDigest.getInstance("MD5"); // TODO burstkit4j integration
    } catch (NoSuchAlgorithmException e) {
      return new MD5.Digest();
    }
  }

  public static byte[] getPublicKey(String secretPhrase) {
    return burstCrypto.getPublicKey(secretPhrase);
  }

  public static byte[] getPrivateKey(String secretPhrase) {
    return burstCrypto.getPrivateKey(secretPhrase);
  }

  public static byte[] sign(byte[] message, String secretPhrase) {
      return burstCrypto.sign(message, secretPhrase);
  }

  public static boolean verify(byte[] signature, byte[] message, byte[] publicKey, boolean enforceCanonical) {
      return burstCrypto.verify(signature, message, publicKey, enforceCanonical);
  }

  public static byte[] aesEncrypt(byte[] plaintext, byte[] myPrivateKey, byte[] theirPublicKey) {
    return burstCrypto.aesSharedEncrypt(plaintext, myPrivateKey, theirPublicKey);
  }

  public static byte[] aesEncrypt(byte[] plaintext, byte[] myPrivateKey, byte[] theirPublicKey, byte[] nonce) {
    return burstCrypto.aesSharedEncrypt(plaintext, myPrivateKey, theirPublicKey, nonce);
  }

  public static byte[] aesDecrypt(byte[] ivCiphertext, byte[] myPrivateKey, byte[] theirPublicKey) {
    return burstCrypto.aesSharedDecrypt(ivCiphertext, myPrivateKey, theirPublicKey);
  }

  public static byte[] aesDecrypt(byte[] ivCiphertext, byte[] myPrivateKey, byte[] theirPublicKey, byte[] nonce) {
    return burstCrypto.aesSharedDecrypt(ivCiphertext, myPrivateKey, theirPublicKey, nonce);
  }

  public static byte[] getSharedSecret(byte[] myPrivateKey, byte[] theirPublicKey) {
    return burstCrypto.getSharedSecret(myPrivateKey, theirPublicKey);
  }

  public static String rsEncode(long id) {
    return burstCrypto.rsEncode(BurstID.fromLong(id));
  }

  public static long rsDecode(String rsString) {
    return burstCrypto.rsDecode(rsString).getSignedLongId();
  }
}
