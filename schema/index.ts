import z from "zod";

export const orderFormSchema = z.object({
  fullName: z.string().min(2, {
    message: "Enter a valid name.",
  }),
  phone: z
    .string()
    .min(11, { message: "Phone is required." })
    .regex(/^(\+8801|8801|01)[0-9]{9}$/, {
      message: "Invalid Bangladeshi number.",
    }),
  address: z.string().min(5, {
    message: "Enter a valid address.",
  }),
  city: z.string().min(2, {
    message: "Enter a valid city.",
  }),
  zipCode: z
    .string()
    .length(4, { message: "Zip must be 4 digits." })
    .regex(/^[0-9]{4}$/, {
      message: "Zip must be numeric.",
    }),
});

export const loginSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(6, {
    message: "Password must be 6 characters.",
  }),
});

export const registerSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be 2 characters.",
  }),
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(6, {
    message: "Password must be 6 characters.",
  }),
});

export const productSchema = z.object({
  title: z.string().min(2, "Title is required"),
  brand: z.string().min(2, "Brand is required"),
  price: z.coerce.number().gt(0, "Price must be greater than 0"),
  image: z.string().min(1, "Image is required"),
  medicineType: z.string().min(2, "Type is required"),
  medicineQuantity: z.string().min(2, "Quantity is required"),
  description: z.string().min(5, "Description is required"),
  stock: z.coerce
    .number()
    .int()
    .min(0, "Stock must be 0 or greater")
    .default(0),
  tags: z.string().optional(),
  isActive: z.boolean().default(true),
});

export const productRequestSchema = z.object({
  productId: z.string().min(1, "Product ID is required"),
  requestedQuantity: z.coerce
    .number()
    .int()
    .min(1, "Requested quantity must be at least 1")
    .max(100, "Requested quantity is too high")
    .default(1),
  message: z.string().optional(),
});

// Form-specific schema that accepts tags as string and transforms to array
export const productFormSchema = z.object({
  title: z.string().min(2, "Title is required"),
  brand: z.string().min(2, "Brand is required"),
  price: z.coerce.number().gt(0, "Price must be greater than 0"),
  image: z.string().min(1, "Image is required"),
  medicineType: z.string().min(2, "Type is required"),
  medicineQuantity: z.string().min(2, "Quantity is required"),
  description: z.string().min(5, "Description is required"),
  stock: z.coerce.number().int().min(0, "Stock must be 0 or greater"),
  tags: z.string().optional(),
  isActive: z.boolean(),
});
