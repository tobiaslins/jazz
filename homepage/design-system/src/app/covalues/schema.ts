import { CoList, CoMap, co } from "jazz-tools";

// Example CoMap class
export class Person extends CoMap {
  name = co.string;
  age = co.number;
  height = co.number;
  weight = co.number;
}

export class ListOfPeople extends CoList.Of(co.ref(Person)) {}
