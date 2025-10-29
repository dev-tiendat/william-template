type UnboxPromise<T extends Promise<any>> = T extends Promise<infer U>
  ? U
  : never

declare type UnionToIntersection<U> = (
  U extends any ? (k: U) => void : never
) extends (k: infer I) => void
  ? I
  : never

type StringToUnion<S extends string> = S extends `${infer S1}${infer S2}`
  ? S1 | StringToUnion<S2>
  : never

type Replace<
  Str extends string,
  From extends string,
  To extends string,
> = Str extends `${infer Left}${From}${infer Right}`
  ? `${Left}${To}${Right}`
  : Str

type ReplaceAll<
  Str extends string,
  From extends string,
  To extends string,
> = Str extends `${infer Left}${From}${infer Right}`
  ? Replace<Replace<`${Left}${To}${Right}`, From, To>, From, To>
  : Str

type CamelCase<S extends string> = S extends `${infer S1}-${infer S2}`
  ? S2 extends Capitalize<S2>
    ? `${S1}-${CamelCase<S2>}`
    : `${S1}${CamelCase<Capitalize<S2>>}`
  : S

type StringToArray<
  S extends string,
  T extends any[] = [],
> = S extends `${infer S1}${infer S2}` ? StringToArray<S2, [...T, S1]> : T

type RequiredKeys<T> = {
  [P in keyof T]: T extends Record<P, T[P]> ? P : never;
}[keyof T]

type OptionalKeys<T> = {
  [P in keyof T]: object extends Pick<T, P> ? P : never;
}[keyof T]

type GetRequired<T> = {
  [P in RequiredKeys<T>]-?: T[P];
}

type GetOptional<T> = {
  [P in OptionalKeys<T>]?: T[P];
}

type Includes<T extends any[], K> = K extends T[number] ? true : false

type MyConcat<T extends any[], U extends any[]> = [...T, ...U]
type MyPush<T extends any[], K> = [...T, K]
type MyPop<T extends any[]> = T extends [...infer L, infer R] ? L : never; // eslint-disable-line

type PropType<T, Path extends string> = string extends Path
  ? unknown
  : Path extends keyof T
    ? T[Path]
    : Path extends `${infer K}.${infer R}`
      ? K extends keyof T
        ? PropType<T[K], R>
        : unknown
      : unknown

type NestedKeyOf<ObjectType extends object> = {
  [Key in keyof ObjectType & (string | number)]: ObjectType[Key] extends object
    ? `${Key}` | `${Key}.${NestedKeyOf<ObjectType[Key]>}`
    : `${Key}`;
}[keyof ObjectType & (string | number)]

type RecordNamePaths<T extends object> = {
  [K in NestedKeyOf<T>]: PropType<T, K>
}
