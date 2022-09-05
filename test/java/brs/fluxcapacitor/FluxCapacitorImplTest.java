package brs.fluxcapacitor;

import brs.Blockchain;
import brs.props.PropertyService;
import brs.props.Props;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.Assert.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

public class FluxCapacitorImplTest {

  private Blockchain blockchainMock;
  private PropertyService propertyServiceMock;

  private FluxCapacitorImpl t;

  @BeforeEach
  public void setUp() {
    blockchainMock = mock(Blockchain.class);
    propertyServiceMock = mock(PropertyService.class);
    reset(blockchainMock, propertyServiceMock);
  }

  @DisplayName("Feature is active on ProdNet")
  @Test
  public void featureIsActiveOnProdNet() {
    when(blockchainMock.getHeight()).thenReturn(500000);

    t = new FluxCapacitorImpl(blockchainMock, propertyServiceMock);

    assertTrue(t.getValue(FluxValues.PRE_POC2));
  }

  @DisplayName("Feature is not active on ProdNet")
  @Test
  public void featureIsInactiveProdNet() {
    when(propertyServiceMock.getInt(any())).thenReturn(-1);
    when(blockchainMock.getHeight()).thenReturn(499999);

    t = new FluxCapacitorImpl(blockchainMock, propertyServiceMock);

    assertFalse(t.getValue(FluxValues.POC2));
  }

  @DisplayName("FluxInt gives its default value when no historical moments changed it yet")
  @Test
  public void fluxIntDefaultValue() {
    when(propertyServiceMock.getInt(any())).thenReturn(-1);
    when(blockchainMock.getHeight()).thenReturn(88000);

    t = new FluxCapacitorImpl(blockchainMock, propertyServiceMock);

    assertEquals((Integer) 255, t.getValue(FluxValues.MAX_NUMBER_TRANSACTIONS));
  }

  @DisplayName("FluxInt gives a new value when a historical moment has passed")
  @Test
  public void fluxIntHistoricalValue() {
    when(propertyServiceMock.getInt(any())).thenReturn(-1);
    when(blockchainMock.getHeight()).thenReturn(500000);

    t = new FluxCapacitorImpl(blockchainMock, propertyServiceMock);

    assertEquals((Integer) 1020, t.getValue(FluxValues.MAX_NUMBER_TRANSACTIONS));
  }

  @DisplayName("FluxInt on TestNet gives its default value when no historical moments changed it yet")
  @Test
  public void fluxIntTestNetDefaultValue() {
    when(propertyServiceMock.getInt(any())).thenReturn(-1);

    t = new FluxCapacitorImpl(blockchainMock, propertyServiceMock);

    when(blockchainMock.getHeight()).thenReturn(5);

    assertEquals((Integer) 255, t.getValue(FluxValues.MAX_NUMBER_TRANSACTIONS));
  }

  @DisplayName("FluxInt test overrriding property")
  @Test
  public void fluxIntTestOverrridePropertyValue() {
    int overridingHeight = 2000;
    when(propertyServiceMock.getInt(any())).thenReturn(-1);
    when(propertyServiceMock.getInt(eq(HistoricalMoments.PRE_POC2.getOverridingProperty()))).thenReturn(overridingHeight);

    t = new FluxCapacitorImpl(blockchainMock, propertyServiceMock);

    when(blockchainMock.getHeight()).thenReturn(overridingHeight);

    assertEquals((Integer) 1020, t.getValue(FluxValues.MAX_NUMBER_TRANSACTIONS));
  }

  @DisplayName("FluxInt on TestNet gives a different value because the historical moment configuration is different")
  @Test
  public void fluxIntTestNetHistoricalMomentChangedThroughProperty() {
    when(propertyServiceMock.getInt(any())).thenReturn(-1);
    when(propertyServiceMock.getInt(eq(Props.PRE_POC2_BLOCK_HEIGHT))).thenReturn(12345);

    t = new FluxCapacitorImpl(blockchainMock, propertyServiceMock);

    assertEquals((Integer) 255, t.getValue(FluxValues.MAX_NUMBER_TRANSACTIONS, 12344));
    assertEquals((Integer) 1020, t.getValue(FluxValues.MAX_NUMBER_TRANSACTIONS, 12345));
  }
}
