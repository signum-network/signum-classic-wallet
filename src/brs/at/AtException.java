package brs.at;

public class AtException extends Exception {
    private static final long serialVersionUID = 1L;

    public AtException(String message) {
        super(message);
    }

    public AtException(String message, Throwable cause) {
        super(message, cause);
    }
}
