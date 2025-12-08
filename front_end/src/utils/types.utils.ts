/**
 * Mở rộng một prop: giữ lại giá trị cũ + thêm mới
 * @template Base   Kiểu gốc (ButtonProps, SelectProps)
 * @template Key    Khóa cần mở rộng
 * @template Extra  Giá trị mở rộng
 */
export type ExtendProp<Base extends object, Key extends keyof Base, Extra extends string> = Base & {
  [P in Key]: Base[Key] | Extra
}
