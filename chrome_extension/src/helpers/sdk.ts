/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from "axios";
import { Accessor, createSignal } from "solid-js";

export class Uint extends Number {}
export class Int extends Number {}
export class Float32 extends Number {}
export class Float64 extends Number {}

export type MaybeUndefined<T> = T | undefined;
export type MaybeNull<T> = T | null;

export interface KeywordRes {
	data: Array<string>
}



export const clients = {
	GetV1Keyword: {
		url: "v1/keyword" as const,
		method: "GET" as const,
		query: undefined,
		body: {},
		response: {
				data: [
				``
				] as Array<string>
			} as KeywordRes 
	}
}

export type Fn<T> = (a: T) => void;

export type SendOptions<Data, Query, Payload, Err = Error> = {
	onSuccess?: Fn<Data>;
	onError?: Fn<Err>;
	query?: Partial<Query>;
	payload?: Partial<Payload>;
};

export type ClientReturn<Data, Query, Payload, Err = Error> = {
	pending: Accessor<boolean>;
	data: Accessor<MaybeNull<Data>>;
	error: Accessor<MaybeNull<Err>>;
	send: Fn<SendOptions<Data, Query, Payload, Err>>;
};

export type Clients = typeof clients;
export type Target = keyof Clients;

export function useQuery<
	K extends Target,
	R extends Clients[K]["response"],
	Q extends Clients[K]["query"],
	P extends Clients[K]["body"]
>(action: K, options?: SendOptions<R, Q, P>): ClientReturn<R, Q, P> {
	const uri = clients[action].url;
	const method = clients[action].method;
	const queryOptions = options;

	const [pending, setPending] = createSignal(false);
	const [data, setData] = createSignal<MaybeNull<R>>(null);
	const [error, setError] = createSignal<MaybeNull<Error>>(null);

	async function send(options: SendOptions<R, Q, P> | undefined = queryOptions) {
		setPending(true);

		const query = options?.query;

		try {
			const { data } = await axios({
				method,
				url: "http://localhost:8008/" + uri,
				data: options?.payload,
				...(query
					? {
						params: query
					}
					: {})
			});

			options?.onSuccess?.(data);
			setData(data);
			setError(null);
		} catch (e) {
			options?.onError?.(e as any);
			setError(e as any);
			setData(null);
		} finally {
			setPending(false);
		}
	}

	return {
		data: data,
		error: error,
		pending: pending,
		send
	};
}