package com.rnziparchive;

import com.facebook.react.bridge.Dynamic;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.ReadableType;

import org.junit.Test;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertTrue;
import static org.junit.Assert.fail;

public class ReadableArrayToStringListTest {

  /** Minimal ReadableArray stub backed by a list of JS-like values. */
  private static class StubReadableArray implements ReadableArray {
    private final List<Object> values;

    StubReadableArray(Object... values) {
      this.values = Arrays.asList(values);
    }

    @Override
    public int size() {
      return values.size();
    }

    @Override
    public ReadableType getType(int index) {
      Object value = values.get(index);
      if (value == null) return ReadableType.Null;
      if (value instanceof String) return ReadableType.String;
      if (value instanceof Boolean) return ReadableType.Boolean;
      if (value instanceof Number) return ReadableType.Number;
      if (value instanceof ReadableMap) return ReadableType.Map;
      if (value instanceof ReadableArray) return ReadableType.Array;
      throw new IllegalStateException("Unsupported stub value: " + value);
    }

    @Override
    public String getString(int index) {
      return (String) values.get(index);
    }

    @Override
    public boolean isNull(int index) {
      return values.get(index) == null;
    }

    @Override
    public boolean getBoolean(int index) {
      throw new UnsupportedOperationException();
    }

    @Override
    public double getDouble(int index) {
      throw new UnsupportedOperationException();
    }

    @Override
    public int getInt(int index) {
      throw new UnsupportedOperationException();
    }

    @Override
    public long getLong(int index) {
      throw new UnsupportedOperationException();
    }

    @Override
    public ReadableArray getArray(int index) {
      throw new UnsupportedOperationException();
    }

    @Override
    public ReadableMap getMap(int index) {
      throw new UnsupportedOperationException();
    }

    @Override
    public Dynamic getDynamic(int index) {
      throw new UnsupportedOperationException();
    }

    @Override
    public ArrayList<Object> toArrayList() {
      return new ArrayList<>(values);
    }
  }

  @Test
  public void convertsStringArray() {
    List<String> result = RNZipArchiveModule.readableArrayToStringList(
        new StubReadableArray("/tmp/a.zip", "/tmp/b.zip"));

    assertEquals(Arrays.asList("/tmp/a.zip", "/tmp/b.zip"), result);
  }

  @Test
  public void rejectsNumberElement() {
    try {
      RNZipArchiveModule.readableArrayToStringList(new StubReadableArray("/tmp/a.zip", 42));
      fail("Expected IllegalArgumentException for number element");
    } catch (IllegalArgumentException ex) {
      assertTrue(ex.getMessage().contains("index 1"));
    }
  }

  @Test
  public void rejectsNullElement() {
    try {
      RNZipArchiveModule.readableArrayToStringList(new StubReadableArray((Object) null));
      fail("Expected IllegalArgumentException for null element");
    } catch (IllegalArgumentException ex) {
      assertTrue(ex.getMessage().contains("index 0"));
    }
  }

  @Test
  public void rejectsBooleanElement() {
    try {
      RNZipArchiveModule.readableArrayToStringList(new StubReadableArray(true));
      fail("Expected IllegalArgumentException for boolean element");
    } catch (IllegalArgumentException ex) {
      assertTrue(ex.getMessage().contains("index 0"));
    }
  }
}
