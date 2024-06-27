FROM golang as builder

RUN apt-get update && apt-get install -y ca-certificates git-core ssh



WORKDIR /app

COPY . .

# ADD keys/id_rsa /root/.ssh/id_rsa
# RUN chmod 700 /root/.ssh/id_rsa
RUN echo "Host github.com\n\tStrictHostKeyChecking no\n" >> /root/.ssh/config
RUN git config --global url.ssh://git@github.com/.insteadOf https://github.com/

RUN go mod tidy

RUN go build -o masterjoin .


FROM golang

ENV TZ="Asia/Jakarta"
COPY --from=builder /app/masterjoin /masterjoin

ENTRYPOINT ["/masterjoin"]
CMD ["/masterjoin"]