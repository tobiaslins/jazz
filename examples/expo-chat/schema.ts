import {
  Account,
  BinaryCoStream,
  co,
  CoList,
  CoMap,
  CoStream,
  Encoders,
  Group,
  ID,
  ImageDefinition,
} from "jazz-tools";

export class Document extends CoMap {
  type = co.literal(
    "invoice",
    "receipt",
    "refund",
    "outgoing_invoice",
    "other"
  );
  date = co.encoded(Encoders.Date);

  pdf = co.ref(BinaryCoStream, { optional: true });
  pdfImage = co.ref(ImageDefinition, { optional: true });
  pdfContent? = co.json<{
    text: string;
    vatNumbers?: string[];
  }>();

  provider = co.string;
  instance = co.ref(PluginInstance, { optional: true });
  vendor = co.ref(Vendor, { optional: true });

  documentId? = co.string;

  amount? = co.number;
  currency? = co.string;

  /**
   * The immutable unique identifier coming from the provider.
   * Used for deduplication, and as a reference inside collections.
   */
  _id = co.string;
  metadata? = co.json<Metadata | EmailMetadata>();
}

export class InvoiceDocument extends Document {
  type = co.literal("invoice", "outgoing_invoice");

  /**
   * The invoice number as it appears on the invoice.
   * Can be changed by the user.
   */
  invoiceId = co.string;

  amount? = co.number;
  currency = co.string;
}

export class RefundDocument extends Document {
  type = co.literal("refund");

  /**
   * The invoice number as it appears on the receipt.
   * Can be changed by the user.
   */
  invoiceId = co.string;
  receiptId = co.string;

  amount? = co.number;
  currency = co.string;
}

type Metadata = {
  plugin?: Record<string, string>;
};

type EmailMetadata = {
  email: {
    browserExtract?: {
      via: "paddle" | "stripe";
      vendor: {
        name?: string;
        domain?: string;
        vatNumber?: string;
      };
    };
    from: {
      name: string;
      address: string;
    };
    to: {
      address: string;
    };
    subject: string;
  };
};

export class MailDocument extends InvoiceDocument {
  provider = co.literal("mail");

  metadata = co.json<
    Metadata & {
      email: {
        browserExtract?: {
          via: "paddle" | "stripe";
          vendor: {
            name?: string;
            domain?: string;
            vatNumber?: string;
          };
        };
        from: {
          name: string;
          address: string;
        };
        to: {
          address: string;
        };
        subject: string;
      };
    }
  >();
}

export type DocumentType = InvoiceDocument | RefundDocument | Document;
export type DocumentTypes =
  | typeof InvoiceDocument
  | typeof RefundDocument
  | typeof Document;

// typeguard for MailInvoice
export const isMailInvoice = (invoice: DocumentType): invoice is MailDocument =>
  invoice?.provider === "mail";

export const isMailMetadata = (
  metadata: Metadata | EmailMetadata
): metadata is EmailMetadata => "email" in metadata;

export class MapOfDocuments extends CoMap.Record(
  co.ref<typeof Document | typeof InvoiceDocument | typeof RefundDocument>(
    (raw) => {
      const type = raw.get("type");
      if (type === "invoice" || !type) return InvoiceDocument;
      if (type === "refund") return RefundDocument;
      return InvoiceDocument;
    }
  )
) {}

export class PluginInstance extends CoMap {
  name = co.string;
  pluginId = co.string;
  // localOnly: boolean
  // config: never

  runHistory = co.ref(RunHistory);

  async getLastSuccessfulRun() {
    const all = await this._refs.runHistory.load();

    if (!all) return;

    const xxx = Object.values(all!._refs).map((s) =>
      typeof s === "object" ? s.load() : null
    );

    const allLoaded = await Promise.all(xxx);

    const historySorted = allLoaded
      .filter((s) => s?.result === "success")
      .sort(
        (a, b) => (b?.startedAt.getTime() ?? 0) - (a?.startedAt.getTime() ?? 0)
      );

    return historySorted[0];
  }
}

export class PluginInstanceList extends CoList.Of(co.ref(PluginInstance)) {}

export type TextMatchRule = {
  type: "!=" | "=";
  value: string;
};

export type Rules = {
  // matchUid?: boolean // shortcut for matching if UID is present on invoice
  // pdfContent?: TextMatchRule[]

  emailSubject?: TextMatchRule[];
  emailFrom?: TextMatchRule[];
  emailTo?: TextMatchRule[]; // 'billing@*'
};

export class Vendor extends CoMap {
  name = co.string;
  key = co.string;
  domain? = co.string;
  // uid?: string
  // verifiedUid?: string
  detectRules = co.json<Rules[]>();
  ignoreRules = co.json<Rules[]>();

  autoAccept = co.boolean;
}

export class VendorList extends CoList.Of(co.ref(Vendor)) {}

export class RunHistoryEntry extends CoMap {
  startedAt = co.encoded(Encoders.Date);
  finishedAt = co.encoded(Encoders.Date);
  duration = co.number;
  result = co.string;

  runOptions = co.json<{
    startDate: string;
    debug: boolean;
  }>();

  documentsFound = co.json<{
    invoices?: {
      alreadyExist: number;
      failed: number;
      new: number;
      outOfRange: number;
    };
  }>();

  errorMessage? = co.string;
}

export class RunHistory extends CoList.Of(co.ref(RunHistoryEntry)) {}

export class BillingObject extends CoMap {
  credits? = co.number;
  plan? = co.string;

  orgGroupId = co.string;
  orgName = co.string;

  uid? = co.string;

  secret = co.string;
}

export class Organization extends CoMap {
  name = co.string;

  invoices = co.ref(MapOfDocuments);
  unsortedInvoices = co.ref(MapOfDocuments);

  startDate? = co.encoded(Encoders.Date);
  vatNumber? = co.string;

  pluginInstances = co.ref(PluginInstanceList, {
    optional: true,
  });

  acceptedVendors = co.ref(VendorList);
  ignoredVendors = co.ref(VendorList);

  viewsStream = co.ref(ViewInvoicesStream);

  runHistory = co.ref(RunHistory, {
    optional: true,
  });

  billing? = co.ref(BillingObject, {
    optional: true,
  });
}

export class ViewInvoicesStream extends CoStream.Of(
  co.json<{
    invoiceId: string;
  }>()
) {}

export class ListOfOrganizations extends CoList.Of(co.ref(Organization)) {}

export class UserAccountRoot extends CoMap {
  organizations = co.ref(ListOfOrganizations);
}
