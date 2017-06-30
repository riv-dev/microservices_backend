require 'sinatra'
require './chatwork_task_puller.rb'
require './credentials.rb'
require './rest_helper.rb'

set :port, 4568



#REST API Endpoints

get '/' do
  'This is the Chatwork Task Grabber Microservice!'
end

get '/new-chatwork-tasks' do
  tasks = ChatworkTaskPuller.get_new_tasks

  #Post to Ryukyu Social API with token and new task for each task
  responses = []
  tasks.each do |task|
    if task["status"] == "finished" #existing task, update the status
      results = /Chatwork Task\[(\d+)\]/m.match(task["name"])
      chatwork_task_id = results[1]

      retrieved_task = RestHelper.get("https://ryukyu-social.cleverword.com/tasks_service/api/tasks-with-name-like/#{chatwork_task_id}",
                                     {'Content-Type' =>'application/json', 'x-access-token' => Credentials.tasks_service_token})
      
      if retrieved_task and retrieved_task["id"]
        http_response = RestHelper.put("https://ryukyu-social.cleverword.com/tasks_service/api/tasks/#{retrieved_task['id']}",
                                       task,
                                       {'Content-Type' =>'application/json', 'x-access-token' => Credentials.tasks_service_token})

        response = {}
        response["ryukyu_tasks_service_response"] = http_response
        response["task"] = task
        responses << response
      end
    else #brand new task, add it
      http_response = RestHelper.post("https://ryukyu-social.cleverword.com/tasks_service/api/tasks",
                                     task,
                                     {'Content-Type' =>'application/json', 'x-access-token' => Credentials.tasks_service_token})

      response = {}
      response["ryukyu_tasks_service_response"] = http_response
      response["task"] = task
      responses << response
    end

  end

  responses.to_json
end