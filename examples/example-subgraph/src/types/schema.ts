import {
  TypedMap,
  Entity,
  Value,
  ValueKind,
  store,
  Address,
  Bytes,
  BigInt
} from "@graphprotocol/graph-ts";

export class ExampleEntity extends Entity {
  constructor(id: string) {
    this.set("id", Value.fromString(id));
    return this;
  }

  save(): void {
    let id = this.get("id");
    assert(id !== null, "Cannot save ExampleEntity entity without an ID");
    assert(
      id.kind == ValueKind.STRING,
      "Cannot save ExampleEntity entity with non-string ID. " +
        'Considering using .toHex() to convert the "id" to a string.'
    );
    store.set("ExampleEntity", id.toString(), this);
  }

  static load(id: string): ExampleEntity | null {
    return store.get("ExampleEntity", id) as ExampleEntity | null;
  }

  get id(): string {
    let value = this.get("id");
    return value.toString();
  }

  set id(value: string) {
    this.set("id", Value.fromString(value));
  }

  get optionalBoolean(): boolean {
    let value = this.get("optionalBoolean");
    return value.toBoolean();
  }

  set optionalBoolean(value: boolean) {
    this.set("optionalBoolean", Value.fromBoolean(value));
  }

  get requiredBoolean(): boolean {
    let value = this.get("requiredBoolean");
    return value.toBoolean();
  }

  set requiredBoolean(value: boolean) {
    this.set("requiredBoolean", Value.fromBoolean(value));
  }

  get optionalBooleanList(): Array<boolean> | null {
    let value = this.get("optionalBooleanList");
    if (value === null) {
      return null;
    } else {
      return value.toBooleanArray();
    }
  }

  set optionalBooleanList(value: Array<boolean> | null) {
    if (value === null) {
      this.unset("optionalBooleanList");
    } else {
      this.set(
        "optionalBooleanList",
        Value.fromBooleanArray(value as Array<boolean>)
      );
    }
  }

  get requiredBooleanList(): Array<boolean> {
    let value = this.get("requiredBooleanList");
    return value.toBooleanArray();
  }

  set requiredBooleanList(value: Array<boolean>) {
    this.set("requiredBooleanList", Value.fromBooleanArray(value));
  }

  get optionalString(): string | null {
    let value = this.get("optionalString");
    if (value === null) {
      return null;
    } else {
      return value.toString();
    }
  }

  set optionalString(value: string | null) {
    if (value === null) {
      this.unset("optionalString");
    } else {
      this.set("optionalString", Value.fromString(value as string));
    }
  }

  get requiredString(): string {
    let value = this.get("requiredString");
    return value.toString();
  }

  set requiredString(value: string) {
    this.set("requiredString", Value.fromString(value));
  }

  get optionalStringList(): Array<string> | null {
    let value = this.get("optionalStringList");
    if (value === null) {
      return null;
    } else {
      return value.toStringArray();
    }
  }

  set optionalStringList(value: Array<string> | null) {
    if (value === null) {
      this.unset("optionalStringList");
    } else {
      this.set(
        "optionalStringList",
        Value.fromStringArray(value as Array<string>)
      );
    }
  }

  get requiredStringList(): Array<string> {
    let value = this.get("requiredStringList");
    return value.toStringArray();
  }

  set requiredStringList(value: Array<string>) {
    this.set("requiredStringList", Value.fromStringArray(value));
  }

  get optionalBytes(): Bytes | null {
    let value = this.get("optionalBytes");
    if (value === null) {
      return null;
    } else {
      return value.toBytes();
    }
  }

  set optionalBytes(value: Bytes | null) {
    if (value === null) {
      this.unset("optionalBytes");
    } else {
      this.set("optionalBytes", Value.fromBytes(value as Bytes));
    }
  }

  get requiredBytes(): Bytes {
    let value = this.get("requiredBytes");
    return value.toBytes();
  }

  set requiredBytes(value: Bytes) {
    this.set("requiredBytes", Value.fromBytes(value));
  }

  get optionalBytesList(): Array<Bytes> | null {
    let value = this.get("optionalBytesList");
    if (value === null) {
      return null;
    } else {
      return value.toBytesArray();
    }
  }

  set optionalBytesList(value: Array<Bytes> | null) {
    if (value === null) {
      this.unset("optionalBytesList");
    } else {
      this.set(
        "optionalBytesList",
        Value.fromBytesArray(value as Array<Bytes>)
      );
    }
  }

  get requiredBytesList(): Array<Bytes> {
    let value = this.get("requiredBytesList");
    return value.toBytesArray();
  }

  set requiredBytesList(value: Array<Bytes>) {
    this.set("requiredBytesList", Value.fromBytesArray(value));
  }

  get optionalInt(): i32 {
    let value = this.get("optionalInt");
    return value.toI32();
  }

  set optionalInt(value: i32) {
    this.set("optionalInt", Value.fromI32(value));
  }

  get requiredInt(): i32 {
    let value = this.get("requiredInt");
    return value.toI32();
  }

  set requiredInt(value: i32) {
    this.set("requiredInt", Value.fromI32(value));
  }

  get optionalIntList(): Array<i32> | null {
    let value = this.get("optionalIntList");
    if (value === null) {
      return null;
    } else {
      return value.toI32Array();
    }
  }

  set optionalIntList(value: Array<i32> | null) {
    if (value === null) {
      this.unset("optionalIntList");
    } else {
      this.set("optionalIntList", Value.fromI32Array(value as Array<i32>));
    }
  }

  get requiredIntList(): Array<i32> {
    let value = this.get("requiredIntList");
    return value.toI32Array();
  }

  set requiredIntList(value: Array<i32>) {
    this.set("requiredIntList", Value.fromI32Array(value));
  }

  get optionalBigInt(): BigInt | null {
    let value = this.get("optionalBigInt");
    if (value === null) {
      return null;
    } else {
      return value.toBigInt();
    }
  }

  set optionalBigInt(value: BigInt | null) {
    if (value === null) {
      this.unset("optionalBigInt");
    } else {
      this.set("optionalBigInt", Value.fromBigInt(value as BigInt));
    }
  }

  get requiredBigInt(): BigInt {
    let value = this.get("requiredBigInt");
    return value.toBigInt();
  }

  set requiredBigInt(value: BigInt) {
    this.set("requiredBigInt", Value.fromBigInt(value));
  }

  get optionalBigIntList(): Array<BigInt> | null {
    let value = this.get("optionalBigIntList");
    if (value === null) {
      return null;
    } else {
      return value.toBigIntArray();
    }
  }

  set optionalBigIntList(value: Array<BigInt> | null) {
    if (value === null) {
      this.unset("optionalBigIntList");
    } else {
      this.set(
        "optionalBigIntList",
        Value.fromBigIntArray(value as Array<BigInt>)
      );
    }
  }

  get requiredBigIntList(): Array<BigInt> {
    let value = this.get("requiredBigIntList");
    return value.toBigIntArray();
  }

  set requiredBigIntList(value: Array<BigInt>) {
    this.set("requiredBigIntList", Value.fromBigIntArray(value));
  }

  get optionalReference(): string | null {
    let value = this.get("optionalReference");
    if (value === null) {
      return null;
    } else {
      return value.toString();
    }
  }

  set optionalReference(value: string | null) {
    if (value === null) {
      this.unset("optionalReference");
    } else {
      this.set("optionalReference", Value.fromString(value as string));
    }
  }

  get requiredReference(): string {
    let value = this.get("requiredReference");
    return value.toString();
  }

  set requiredReference(value: string) {
    this.set("requiredReference", Value.fromString(value));
  }

  get optionalReferenceList(): Array<string> | null {
    let value = this.get("optionalReferenceList");
    if (value === null) {
      return null;
    } else {
      return value.toStringArray();
    }
  }

  set optionalReferenceList(value: Array<string> | null) {
    if (value === null) {
      this.unset("optionalReferenceList");
    } else {
      this.set(
        "optionalReferenceList",
        Value.fromStringArray(value as Array<string>)
      );
    }
  }

  get requiredReferenceList(): Array<string> {
    let value = this.get("requiredReferenceList");
    return value.toStringArray();
  }

  set requiredReferenceList(value: Array<string>) {
    this.set("requiredReferenceList", Value.fromStringArray(value));
  }
}

export class OtherEntity extends Entity {
  constructor(id: string) {
    this.set("id", Value.fromString(id));
    return this;
  }

  save(): void {
    let id = this.get("id");
    assert(id !== null, "Cannot save OtherEntity entity without an ID");
    assert(
      id.kind == ValueKind.STRING,
      "Cannot save OtherEntity entity with non-string ID. " +
        'Considering using .toHex() to convert the "id" to a string.'
    );
    store.set("OtherEntity", id.toString(), this);
  }

  static load(id: string): OtherEntity | null {
    return store.get("OtherEntity", id) as OtherEntity | null;
  }

  get id(): string {
    let value = this.get("id");
    return value.toString();
  }

  set id(value: string) {
    this.set("id", Value.fromString(value));
  }
}
