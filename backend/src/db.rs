use std::env;

use actix_session::storage::RedisSessionStore;
use actix_web::middleware::Logger;
use sqlx::{postgres::PgPoolOptions, Postgres};

pub type MainDbPooledConnection = sqlx::Pool<Postgres>;
pub type SessionStore = RedisSessionStore;

pub async fn establish_database_pool() -> MainDbPooledConnection {
    let database = env::var("POSTGRES_DATABASE").expect("POSTGRES_DATABASE is not set");
    let user = env::var("POSTGRES_USER").expect("POSTGRES_USER is not set");
    let password = env::var("POSTGRES_PASSWORD").expect("POSTGRES_PASSWORD is not set");
    let port = env::var("POSTGRES_PORT").unwrap_or("5432".to_string());
    let host = env::var("POSTGRES_HOST").unwrap_or("127.0.0.1".to_string());

    // postgres://user:pass@127.0.0.1:5432/db_name
    let database_url = format!(
        "postgres://{}:{}@{}:{}/{}",
        user, password, host, port, database
    );

    println!("{}", database_url);

    PgPoolOptions::new()
        .max_connections(20)
        .connect(&database_url)
        .await
        .expect("Failed to establish connection to postgres")
}

pub async fn establish_session_db() -> SessionStore {
    let session_database_url =
        env::var("SESSION_DATABASE_URL").expect("SESSION_DATABASE_URL must be set");
    RedisSessionStore::new(session_database_url)
        .await
        .expect("Failed to establish connection to redis")
}
