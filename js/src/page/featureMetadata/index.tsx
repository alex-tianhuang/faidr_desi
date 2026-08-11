import fileUrl from "@/assets/feature_metadata.csv?url";
import * as papa from "papaparse";
import React from "react";
import Loading from "@/components/loading";
import { UnexpectedError } from "@/components/errors";
import { FeatureMetadataRowSchema } from "@/types/featureMetadata";
import { z } from "zod/mini";
import FeatureMetadataCard from "./featureMetadataCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function FeatureMetadataSection(props: {
  featureMetadataRef: React.RefObject<HTMLDetailsElement | null>
}) {
  const {featureMetadataRef} = props;
  const [data, setData] = React.useState<FeatureMetadataRowSchema[] | null>(
    null,
  );
  const [error, setError] = React.useState<unknown | null>(null);
  const [search, setSearch] = React.useState("");
  React.useEffect(() => {
    if (data) return;
    setError(null);
    setSearch("");
    fetch(fileUrl)
      .then((resp) => resp.text())
      .then((blob) => {
        const r1 = papa.parse(blob, { header: true });
        if (r1.errors.length > 0) {
          console.debug(
            "parsing for some rows of feature metadata failed",
            r1.errors,
          );
        }
        const r2 = z.array(FeatureMetadataRowSchema).safeParse(r1.data);
        if (!r2.success) {
          const message = z.prettifyError(r2.error);
          console.debug(
            "Unexpected file format for feature metadata:",
            message,
          );
          throw new Error("unexpected file format for feature metadata");
        }
        setData(r2.data);
      })
      .catch((err) => setError(err));
  }, []);
  if (error) {
    const reason = error instanceof Error ? error.message : `${error}`;
    return (
      <div className="gap-2 flex flex-col">
        <UnexpectedError
          while="loading feature metadata"
          error={reason}
        ></UnexpectedError>
      </div>
    );
  }
  if (!data) {
    return (
      <div className="gap-2 flex flex-col">
        <Loading>Feature metadata is loading...</Loading>
      </div>
    );
  }
  const filteredData =
    search.length === 0
      ? data
      : data.filter((item) => {
          for (const [_, text] of Object.entries(item)) {
            if (text.toLowerCase().includes(search.toLowerCase())) {
              return true;
            }
          }
          return false;
        });
  return (
    <div className="gap-2 flex flex-col p-2.5 border rounded-md">
      <p className="flex-1 text-md font-bold text-foreground underline">
        About these features
      </p>
      <details ref={featureMetadataRef}>
        <summary className="text-muted-foreground text-sm">Read more</summary>
        <div className="flex flex-col gap-2 text-muted-foreground">
          <div className="text-center">
            Search for specific features below, or download all the associated
            data as a metadata spreadsheet (CSV).
          </div>
          <div className="flex flex-row gap-2">
            <Input
              className="border rounded-md"
              placeholder="Search for a feature or related terms"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <a href={fileUrl} download="Feature_Metadata.csv">
              <Button className="rounded-xl">Download Metadata (CSV)</Button>
            </a>
          </div>
          {filteredData.length > 0 ? (
            <div className="overflow-auto gap-2 p-2.5 grid rounded-md border border-input max-h-100 grid-cols-1 sm:grid-cols-2">
              {filteredData.map((item) => (
                <div id={item["Feature Code"]}>
                  <FeatureMetadataCard data={item} />
                </div>
              ))}
            </div>
          ) : (
            <div className="gap-2 p-2.5 rounded-md border border-input max-h-100 bg-card">
              No features match the search term:{" "}
              <span className="underline">{search}</span>
            </div>
          )}
        </div>
      </details>
    </div>
  );
}
