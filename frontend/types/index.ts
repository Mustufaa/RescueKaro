export type UseCase = "Helmet" | "Bike / Scooter" | "Car" | "Bag" | "ID / Personal" | "Other";
export interface Review { id: string; customerName: string; location: string; rating: number; review: string; useCase: UseCase | "Family"; avatar: string; createdAt: string; verified: boolean; sample?: boolean }
export interface Order { id: string; date: string; product: string; useCase: UseCase; quantity: number; amount: number; payment: "Paid" | "Pending" | "Failed"; status: "Processing" | "Printing" | "Shipped" | "Delivered"; qrStatus: "Awaiting verification" | "Verified" | "Generated"; tracking?: string }
export interface User { id:string; fullName:string; email:string; phone:string; phoneVerified:boolean }
export interface Address { line1:string; line2:string; landmark:string; city:string; state:string; pinCode:string; country:string }
export interface EmergencyContact { id:string; name:string; relationship:string; phone:string; primary:boolean }
export interface MedicalInformation { allergies:string; condition:string; medication:string; note:string }
export interface EmergencyServiceNumber { label:string; number:string; verified:boolean }
export interface EmergencyServiceDirectory { country:string; state:string; city:string; services:EmergencyServiceNumber[]; verificationStatus:"verified"|"partial"|"unavailable"; source:string; lastVerified:string }
export interface QRSelections { dob:boolean; age:boolean; address:boolean; allergies:boolean; medication:boolean; emergencyNote:boolean; additionalContacts:boolean; emergencyServices:boolean }
export interface EmergencyProfile { fullName:string; bloodGroup:string; city:string; state:string; dateOfBirth?:string; age?:string; contacts:EmergencyContact[]; medical:MedicalInformation; address:Address; emergencyServices?:EmergencyServiceDirectory; selections:QRSelections }
export interface QRProfile { profile:EmergencyProfile; generatedAt:string; orderId:string; useCase:UseCase }
export interface QRPayload { normalizedText:string; fingerprint:string }
export interface Product { id:string; name:string; price:number; stickerCount:number; coverCount:number }
export interface OrderItem { productId:string; name:string; quantity:number; unitPrice:number }
export interface Payment { id:string; orderId:string; amount:number; status:"pending"|"verified"|"failed" }
export interface Shipment { status:"pending"|"processing"|"shipped"|"delivered"; charge:number; tracking?:string }
export interface ReplacementRequest { id:string; orderId:string; reason:string; status:"submitted"|"reviewing"|"approved"|"rejected" }
export interface AdminUser { id:string; name:string; role:"admin"|"operator" }
